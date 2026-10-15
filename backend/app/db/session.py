import os
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

engine = create_engine(
    settings.SYNC_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from backend.app.models import entities  # ensure models are registered
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
