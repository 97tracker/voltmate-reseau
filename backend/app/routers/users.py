from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, User
from app.schemas import TokenOut, UserCreate, UserLogin, UserProfileOut, UserUpdate
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=user)


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=user)


@router.get("/me", response_model=UserProfileOut)
def get_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reports_count = db.query(Report).filter(Report.user_id == user.id).count()
    profile = UserProfileOut.model_validate(user)
    profile.reports_count = reports_count
    return profile


@router.patch("/me", response_model=UserProfileOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.vehicle = payload.vehicle
    db.add(user)
    db.commit()
    db.refresh(user)

    reports_count = db.query(Report).filter(Report.user_id == user.id).count()
    profile = UserProfileOut.model_validate(user)
    profile.reports_count = reports_count
    return profile
