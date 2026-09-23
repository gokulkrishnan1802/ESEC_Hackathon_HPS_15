"""
engine_client.py

Adapter that calls the existing TypeScript fraud engine
(src/lib/fraudEngine.ts) over HTTP, via the engineServer.ts service.

This module intentionally contains ZERO fraud-detection logic. It only:
  1. Builds the exact request shape the engine expects (PaymentInput +
     AnalysisContext, per src/lib/types.ts).
  2. Calls POST {ENGINE_URL} with that payload.
  3. Validates that the response is a well-formed RiskResult.
  4. Returns it unchanged to the caller.

If the engine is unreachable or returns malformed data, this module
raises a clear exception rather than fabricating a result.
"""

import os
from typing import Any, Dict, List, Optional

import httpx

ENGINE_URL = os.environ.get("ENGINE_URL", "http://localhost:4000/analyze")
ENGINE_TIMEOUT_SECONDS = float(os.environ.get("ENGINE_TIMEOUT_SECONDS", "5"))

VALID_RISK_LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
VALID_DECISIONS = {"ALLOW", "WARN", "BLOCK"}


class EngineUnavailableError(Exception):
    """Raised when the fraud engine service cannot be reached at all."""


class EngineInvalidResponseError(Exception):
    """Raised when the fraud engine responds but the payload is malformed."""


def _to_payment_input(
    receiver_upi: str,
    amount: float,
    transaction_type: str,
    message: Optional[str] = None,
) -> Dict[str, Any]:
    """Build a PaymentInput object exactly matching src/lib/types.ts."""
    payload: Dict[str, Any] = {
        "receiverUpi": receiver_upi,
        "amount": amount,
        "transactionType": transaction_type,
    }
    if message:
        payload["message"] = message
    return payload


def db_transaction_to_engine_history_item(txn) -> Dict[str, Any]:
    """
    Convert a backend Transaction ORM row into the exact `Transaction`
    shape expected by the TS engine's AnalysisContext.history
    (src/lib/types.ts):

        interface Transaction extends PaymentInput {
          id: string;
          timestamp: number;
          risk: RiskResult;
          status: TransactionStatus;
        }
    """
    import json

    try:
        reasons = json.loads(txn.reasons) if txn.reasons else []
    except (TypeError, ValueError):
        reasons = []

    try:
        signals = json.loads(txn.signals) if txn.signals else {}
    except (TypeError, ValueError):
        signals = {}

    item = _to_payment_input(
        txn.receiver_upi, txn.amount, txn.transaction_type, txn.message
    )
    item["id"] = str(txn.id)
    item["timestamp"] = int(txn.created_at.timestamp() * 1000)
    item["status"] = txn.status
    item["risk"] = {
        "risk_score": txn.risk_score or 0,
        "risk_level": txn.risk_level or "UNKNOWN",
        "decision": txn.decision or "PENDING",
        "reasons": reasons,
        "signals": signals,
    }
    return item


def analyze_transaction(
    receiver_upi: str,
    amount: float,
    transaction_type: str,
    history: List[Dict[str, Any]],
    message: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Call the fraud engine's /analyze endpoint and return its RiskResult.

    Raises:
        EngineUnavailableError: engine service could not be reached.
        EngineInvalidResponseError: engine responded with an unusable body.
    """
    payload = {
        "input": _to_payment_input(receiver_upi, amount, transaction_type, message),
        "history": history,
    }

    try:
        response = httpx.post(ENGINE_URL, json=payload, timeout=ENGINE_TIMEOUT_SECONDS)
    except httpx.RequestError as exc:
        raise EngineUnavailableError(
            f"Could not reach fraud engine at {ENGINE_URL}: {exc}"
        ) from exc

    if response.status_code != 200:
        raise EngineUnavailableError(
            f"Fraud engine returned HTTP {response.status_code}: {response.text[:300]}"
        )

    try:
        result = response.json()
    except ValueError as exc:
        raise EngineInvalidResponseError(
            "Fraud engine response was not valid JSON"
        ) from exc

    _validate_risk_result(result)
    return result


def _validate_risk_result(result: Dict[str, Any]) -> None:
    if not isinstance(result, dict):
        raise EngineInvalidResponseError("Engine response is not a JSON object")

    risk_score = result.get("risk_score")
    if not isinstance(risk_score, (int, float)) or not (0 <= risk_score <= 100):
        raise EngineInvalidResponseError(
            f"Invalid risk_score from engine: {risk_score!r}"
        )

    risk_level = result.get("risk_level")
    if risk_level not in VALID_RISK_LEVELS:
        raise EngineInvalidResponseError(
            f"Invalid risk_level from engine: {risk_level!r}"
        )

    decision = result.get("decision")
    if decision not in VALID_DECISIONS:
        raise EngineInvalidResponseError(
            f"Invalid decision from engine: {decision!r}"
        )

    if not isinstance(result.get("reasons"), list):
        raise EngineInvalidResponseError("Engine response missing 'reasons' list")

    if not isinstance(result.get("signals"), dict):
        raise EngineInvalidResponseError("Engine response missing 'signals' object")
