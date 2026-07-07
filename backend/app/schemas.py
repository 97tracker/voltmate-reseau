import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models import ConnectorType, ReportStatus, StationStatus, UserRole


# ---------- Users ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str
    role: UserRole
    points: int
    vehicle: str | None = None
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class BadgeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    badge_name: str
    created_at: datetime


class UserProfileOut(UserOut):
    badges: list[BadgeOut] = []
    reports_count: int = 0


class UserUpdate(BaseModel):
    vehicle: str | None = Field(default=None, max_length=120)


# ---------- Stations ----------

class StationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=300)
    latitude: float
    longitude: float
    operator: str | None = None
    connector_type: ConnectorType = ConnectorType.type2
    advertised_power_kw: float | None = None
    estimated_price: str | None = None


class StationPhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    photo_url: str
    created_at: datetime


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    created_at: datetime
    user_id: uuid.UUID | None = None


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ReportStatus
    comment: str | None = None
    observed_power_kw: float | None = None
    observed_price: str | None = None
    waiting_time_minutes: int | None = None
    photo_url: str | None = None
    created_at: datetime


class StationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    address: str
    latitude: float
    longitude: float
    operator: str | None
    connector_type: ConnectorType
    advertised_power_kw: float | None
    estimated_price: str | None
    current_status: StationStatus
    reliability_score: int
    created_at: datetime
    updated_at: datetime


class StationDetailOut(StationOut):
    reports: list[ReportOut] = []
    comments: list[CommentOut] = []
    photos: list[StationPhotoOut] = []


# ---------- Reports ----------

class ReportCreate(BaseModel):
    status: ReportStatus
    comment: str | None = Field(default=None, max_length=1000)
    observed_power_kw: float | None = None
    observed_price: str | None = None
    waiting_time_minutes: int | None = Field(default=None, ge=0, le=600)
    photo_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None


# ---------- Comments ----------

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


# ---------- Assistant ----------

class AssistantQuery(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    station_id: uuid.UUID | None = None
    latitude: float | None = None
    longitude: float | None = None
    trip_distance_km: float | None = None


class AssistantAnswer(BaseModel):
    answer: str
    suggested_station_ids: list[uuid.UUID] = []


# ---------- Admin ----------

class AdminStats(BaseModel):
    total_stations: int
    total_reports: int
    total_users: int
    recent_stations: list[StationOut]
    recent_reports: list[ReportOut]
