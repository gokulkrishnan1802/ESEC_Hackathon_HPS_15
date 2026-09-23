"""
SQLAlchemy ORM models for the SecurePay backend.

These tables are the backend's own persistence layer. They do NOT
contain any fraud-scoring logic — risk_score / risk_level / decision
are always populated from the existing TypeScript fraud engine
(src/lib/fraudEngine.ts) via engine_client.py, never computed here.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    receiver_upi = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)
    message = Column(String, nullable=True)

    # Fraud analysis results — always sourced from the engine.
    risk_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String, nullable=False, default="UNKNOWN")
    decision = Column(String, nullable=False, default="PENDING")

    # Raw reasons/signals returned by the engine, kept as JSON text so the
    # frontend/dashboard can render the full explanation if useful.
    reasons = Column(Text, nullable=True)  # JSON-encoded list[RiskReason]
    signals = Column(Text, nullable=True)  # JSON-encoded FraudSignals

    status = Column(String, nullable=False, default="PENDING")
    created_at = Column(DateTime, default=utcnow, nullable=False)

    reports = relationship("FraudReport", back_populates="transaction")
    feedback_entries = relationship("Feedback", back_populates="transaction")


class Receiver(Base):
    __tablename__ = "receivers"

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String, unique=True, nullable=False, index=True)
    report_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    receiver_upi = Column(String, nullable=False, index=True)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    transaction = relationship("Transaction", back_populates="reports")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    feedback = Column(String, nullable=False)  # FRAUD | SAFE | FALSE_WARNING
    created_at = Column(DateTime, default=utcnow, nullable=False)

    transaction = relationship("Transaction", back_populates="feedback_entries")
