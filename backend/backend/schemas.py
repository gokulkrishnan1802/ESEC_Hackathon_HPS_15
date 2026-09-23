"""
Pydantic schemas for the SecurePay backend API.

These define request validation and response shapes only. No fraud
scoring logic lives here — risk fields are always populated from the
existing TypeScript fraud engine's output.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

ALLOWED_STATUSES = {"PENDING", "COMPLETED", "CANCELLED", "USER_CONFIRMED"}
ALLOWED_RISK_LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
ALLOWED_FEEDBACK = {"FRAUD", "SAFE", "FALSE_WARNING"}


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

class TransactionCreate(BaseModel):
    receiver_upi: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    transaction_type: str = Field(..., min_length=1)
    message: Optional[str] = None

    @field_validator("receiver_upi")
    @classmethod
    def receiver_upi_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("receiver_upi must not be empty")
        return v

    @field_validator("transaction_type")
    @classmethod
    def transaction_type_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("transaction_type must not be empty")
        return v


class TransactionStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_allowed(cls, v: str) -> str:
        if v not in ALLOWED_STATUSES:
            raise ValueError(
                f"status must be one of {sorted(ALLOWED_STATUSES)}"
            )
        return v


class RiskReasonOut(BaseModel):
    label: str
    weight: float
    severity: str


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    receiver_upi: str
    amount: float
    transaction_type: str
    message: Optional[str] = None
    risk_score: int
    risk_level: str
    decision: str
    status: str
    created_at: datetime
    reasons: Optional[List[RiskReasonOut]] = None
    signals: Optional[dict] = None


# ---------------------------------------------------------------------------
# Receivers
# ---------------------------------------------------------------------------

class ReceiverOut(BaseModel):
    upi_id: str
    report_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Fraud reports
# ---------------------------------------------------------------------------

class FraudReportCreate(BaseModel):
    transaction_id: Optional[int] = None
    receiver_upi: str = Field(..., min_length=1)
    reason: str = Field(..., min_length=1)

    @field_validator("receiver_upi")
    @classmethod
    def receiver_upi_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("receiver_upi must not be empty")
        return v


class FraudReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: Optional[int] = None
    receiver_upi: str
    reason: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class FeedbackCreate(BaseModel):
    transaction_id: int
    feedback: str

    @field_validator("feedback")
    @classmethod
    def feedback_allowed(cls, v: str) -> str:
        if v not in ALLOWED_FEEDBACK:
            raise ValueError(f"feedback must be one of {sorted(ALLOWED_FEEDBACK)}")
        return v


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: int
    feedback: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class RiskDistribution(BaseModel):
    LOW: int = 0
    MEDIUM: int = 0
    HIGH: int = 0
    CRITICAL: int = 0


class DashboardStats(BaseModel):
    total_analyzed: int
    total_transactions: int
    completed: int
    cancelled: int
    risk_distribution: RiskDistribution
