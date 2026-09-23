"""
SecurePay UPI Fraud Alert System — FastAPI backend.

Responsible for transaction management, persistence, receiver
reputation/report bookkeeping, user feedback, and dashboard
statistics. All fraud risk scoring is delegated to the existing
TypeScript fraud engine (src/lib/fraudEngine.ts) via engine_client.py —
this file never computes a risk score itself.
"""

import json
import logging
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from . import engine_client, models, schemas
from .database import get_db, init_db

logger = logging.getLogger("securepay.backend")

app = FastAPI(title="SecurePay UPI Fraud Alert System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"service": "SecurePay backend", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_transaction_or_404(db: Session, transaction_id: int) -> models.Transaction:
    txn = db.get(models.Transaction, transaction_id)
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


def _serialize_transaction(txn: models.Transaction) -> dict:
    try:
        reasons = json.loads(txn.reasons) if txn.reasons else None
    except (TypeError, ValueError):
        reasons = None
    try:
        signals = json.loads(txn.signals) if txn.signals else None
    except (TypeError, ValueError):
        signals = None

    return {
        "id": txn.id,
        "receiver_upi": txn.receiver_upi,
        "amount": txn.amount,
        "transaction_type": txn.transaction_type,
        "message": txn.message,
        "risk_score": txn.risk_score,
        "risk_level": txn.risk_level,
        "decision": txn.decision,
        "status": txn.status,
        "created_at": txn.created_at,
        "reasons": reasons,
        "signals": signals,
    }


def _get_or_create_receiver(db: Session, upi_id: str) -> models.Receiver:
    receiver = (
        db.query(models.Receiver).filter(models.Receiver.upi_id == upi_id).first()
    )
    if receiver is None:
        receiver = models.Receiver(upi_id=upi_id, report_count=0)
        db.add(receiver)
        db.flush()
    return receiver


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

@app.post("/api/transactions", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(
    payload: schemas.TransactionCreate, db: Session = Depends(get_db)
):
    txn = models.Transaction(
        receiver_upi=payload.receiver_upi,
        amount=payload.amount,
        transaction_type=payload.transaction_type,
        message=payload.message,
        risk_score=0,
        risk_level="UNKNOWN",
        decision="PENDING",
        status="PENDING",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _serialize_transaction(txn)


@app.get("/api/transactions", response_model=List[schemas.TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    txns = (
        db.query(models.Transaction)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )
    return [_serialize_transaction(t) for t in txns]


@app.get("/api/transactions/{transaction_id}", response_model=schemas.TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    txn = _get_transaction_or_404(db, transaction_id)
    return _serialize_transaction(txn)


@app.post("/api/transactions/{transaction_id}/analyze", response_model=schemas.TransactionOut)
def analyze_transaction(transaction_id: int, db: Session = Depends(get_db)):
    txn = _get_transaction_or_404(db, transaction_id)

    # Build history from every OTHER transaction, in the exact shape the
    # TS engine expects (src/lib/types.ts Transaction).
    other_txns = (
        db.query(models.Transaction)
        .filter(models.Transaction.id != transaction_id)
        .order_by(models.Transaction.created_at.asc())
        .all()
    )
    history = [
        engine_client.db_transaction_to_engine_history_item(t) for t in other_txns
    ]

    try:
        result = engine_client.analyze_transaction(
            receiver_upi=txn.receiver_upi,
            amount=txn.amount,
            transaction_type=txn.transaction_type,
            history=history,
            message=txn.message,
        )
    except engine_client.EngineUnavailableError as exc:
        logger.error("Fraud engine unavailable: %s", exc)
        # Do NOT silently mark the transaction as safe — surface the error.
        return JSONResponse(
            status_code=503, content={"error": "Fraud engine unavailable"}
        )
    except engine_client.EngineInvalidResponseError as exc:
        logger.error("Fraud engine returned invalid data: %s", exc)
        return JSONResponse(
            status_code=502, content={"error": "Fraud engine returned invalid data"}
        )

    txn.risk_score = result["risk_score"]
    txn.risk_level = result["risk_level"]
    txn.decision = result["decision"]
    txn.reasons = json.dumps(result["reasons"])
    txn.signals = json.dumps(result["signals"])

    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _serialize_transaction(txn)


@app.patch("/api/transactions/{transaction_id}/status", response_model=schemas.TransactionOut)
def update_transaction_status(
    transaction_id: int,
    payload: schemas.TransactionStatusUpdate,
    db: Session = Depends(get_db),
):
    txn = _get_transaction_or_404(db, transaction_id)
    txn.status = payload.status
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _serialize_transaction(txn)


# ---------------------------------------------------------------------------
# Receivers
# ---------------------------------------------------------------------------

@app.get("/api/receivers/{upi_id}", response_model=schemas.ReceiverOut)
def get_receiver(upi_id: str, db: Session = Depends(get_db)):
    receiver = (
        db.query(models.Receiver).filter(models.Receiver.upi_id == upi_id).first()
    )
    if receiver is None:
        # Not an error — simply a receiver with no reports on file yet.
        return {
            "upi_id": upi_id,
            "report_count": 0,
            "created_at": None,
            "updated_at": None,
        }
    return {
        "upi_id": receiver.upi_id,
        "report_count": receiver.report_count,
        "created_at": receiver.created_at,
        "updated_at": receiver.updated_at,
    }


# ---------------------------------------------------------------------------
# Fraud reports
# ---------------------------------------------------------------------------

@app.post("/api/reports", response_model=schemas.FraudReportOut, status_code=201)
def create_report(payload: schemas.FraudReportCreate, db: Session = Depends(get_db)):
    if payload.transaction_id is not None:
        _get_transaction_or_404(db, payload.transaction_id)

    report = models.FraudReport(
        transaction_id=payload.transaction_id,
        receiver_upi=payload.receiver_upi,
        reason=payload.reason,
    )
    db.add(report)

    receiver = _get_or_create_receiver(db, payload.receiver_upi)
    receiver.report_count += 1
    db.add(receiver)

    db.commit()
    db.refresh(report)
    return report


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

@app.post("/api/feedback", response_model=schemas.FeedbackOut, status_code=201)
def create_feedback(payload: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    _get_transaction_or_404(db, payload.transaction_id)

    feedback = models.Feedback(
        transaction_id=payload.transaction_id,
        feedback=payload.feedback,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    all_txns = db.query(models.Transaction).all()

    total_transactions = len(all_txns)
    total_analyzed = sum(1 for t in all_txns if t.risk_level != "UNKNOWN")
    completed = sum(1 for t in all_txns if t.status == "COMPLETED")
    cancelled = sum(1 for t in all_txns if t.status == "CANCELLED")

    distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for t in all_txns:
        if t.risk_level in distribution:
            distribution[t.risk_level] += 1

    return {
        "total_analyzed": total_analyzed,
        "total_transactions": total_transactions,
        "completed": completed,
        "cancelled": cancelled,
        "risk_distribution": distribution,
    }
