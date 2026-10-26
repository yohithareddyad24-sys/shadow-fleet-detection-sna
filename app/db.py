from sqlalchemy import (create_engine, Column, Integer, String, Float,
                        DateTime, JSON, Index)
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


class Vessel(Base):
    __tablename__ = "vessels"
    mmsi = Column(String(9), primary_key=True)
    name = Column(String)
    ship_type = Column(Integer)      # AIS type code; 80-89 are tankers
    flag_mid = Column(String(3))     # first 3 digits of MMSI (country code)
    imo = Column(String)
    last_seen = Column(DateTime)


class Position(Base):
    __tablename__ = "positions"
    id = Column(Integer, primary_key=True)
    mmsi = Column(String(9), index=True)
    ts = Column(DateTime, index=True)
    lat = Column(Float)
    lon = Column(Float)
    speed = Column(Float)
    __table_args__ = (Index("ix_pos_mmsi_ts", "mmsi", "ts"),)


class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True)
    mmsi_a = Column(String(9))
    mmsi_b = Column(String(9))
    count = Column(Integer)
    avg_duration_hours = Column(Float)
    min_distance_nm = Column(Float)
    risk = Column(Float)
    computed_at = Column(DateTime)


class RiskResult(Base):
    __tablename__ = "risk_results"
    mmsi = Column(String(9), primary_key=True)
    score = Column(Float)
    tier = Column(String)
    reasons = Column(JSON)
    degree = Column(Float)
    betweenness = Column(Float)
    gap_count = Column(Integer)
    community = Column(Integer)
    computed_at = Column(DateTime)


def init_db():
    Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
