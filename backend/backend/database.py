"""
SQLAlchemy engine/session setup for the SecurePay backend.

Uses SQLite for the hackathon prototype. The database file lives at
backend/securepay.db and is the single source of truth for all
transaction, receiver, report, and feedback data.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "securepay.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# check_same_thread=False is required for SQLite when used with FastAPI's
# threaded request handling.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables if they do not already exist. Never drops data."""
    # Import models here so they are registered on Base.metadata before
    # create_all is called.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
