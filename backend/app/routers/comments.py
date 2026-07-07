import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Station, User
from app.schemas import CommentCreate, CommentOut
from app.security import get_current_user_optional

router = APIRouter(prefix="/stations/{station_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentOut])
def list_comments(station_id: uuid.UUID, db: Session = Depends(get_db)):
    return (
        db.query(Comment)
        .filter(Comment.station_id == station_id)
        .order_by(Comment.created_at.desc())
        .all()
    )


@router.post("", response_model=CommentOut, status_code=201)
def create_comment(
    station_id: uuid.UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    comment = Comment(station_id=station_id, user_id=user.id if user else None, content=payload.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
