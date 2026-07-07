import enum
import uuid

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


def uuid_pk():
    return Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class StationStatus(str, enum.Enum):
    ok = "ok"
    warning = "warning"
    broken = "broken"
    unknown = "unknown"


class ConnectorType(str, enum.Enum):
    type2 = "type2"
    ccs = "ccs"
    chademo = "chademo"
    other = "other"


class ReportStatus(str, enum.Enum):
    working = "working"
    occupied = "occupied"
    slow = "slow"
    broken = "broken"
    cable_broken = "cable_broken"
    payment_failed = "payment_failed"
    ice_parked = "ice_parked"
    wrong_price = "wrong_price"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = uuid_pk()
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    points = Column(Integer, nullable=False, default=0)
    vehicle = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reports = relationship("Report", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    photos = relationship("StationPhoto", back_populates="user")
    badges = relationship("Badge", back_populates="user")


class Station(Base):
    __tablename__ = "stations"

    id = uuid_pk()
    name = Column(String(200), nullable=False)
    address = Column(String(300), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operator = Column(String(120), nullable=True)
    connector_type = Column(Enum(ConnectorType), nullable=False, default=ConnectorType.type2)
    advertised_power_kw = Column(Float, nullable=True)
    estimated_price = Column(String(80), nullable=True)
    current_status = Column(Enum(StationStatus), nullable=False, default=StationStatus.unknown)
    reliability_score = Column(Integer, nullable=False, default=50)
    source = Column(String(20), nullable=False, default="community")
    external_ref = Column(String(120), nullable=True, unique=True, index=True)
    created_by_user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reports = relationship("Report", back_populates="station", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="station", cascade="all, delete-orphan")
    photos = relationship("StationPhoto", back_populates="station", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = uuid_pk()
    station_id = Column(Uuid(as_uuid=True), ForeignKey("stations.id"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ReportStatus), nullable=False)
    comment = Column(Text, nullable=True)
    observed_power_kw = Column(Float, nullable=True)
    observed_price = Column(String(80), nullable=True)
    waiting_time_minutes = Column(Integer, nullable=True)
    photo_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    station = relationship("Station", back_populates="reports")
    user = relationship("User", back_populates="reports")


class Comment(Base):
    __tablename__ = "comments"

    id = uuid_pk()
    station_id = Column(Uuid(as_uuid=True), ForeignKey("stations.id"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    station = relationship("Station", back_populates="comments")
    user = relationship("User", back_populates="comments")


class StationPhoto(Base):
    __tablename__ = "station_photos"

    id = uuid_pk()
    station_id = Column(Uuid(as_uuid=True), ForeignKey("stations.id"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    photo_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    station = relationship("Station", back_populates="photos")
    user = relationship("User", back_populates="photos")


class Badge(Base):
    __tablename__ = "badges"

    id = uuid_pk()
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    badge_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="badges")
