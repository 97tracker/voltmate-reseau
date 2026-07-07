from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai import call_external_ai, estimate_battery_percent
from app.config import get_settings
from app.database import get_db
from app.models import Station, StationStatus
from app.routers.stations import _haversine_km
from app.schemas import AssistantAnswer, AssistantQuery

router = APIRouter(prefix="/assistant", tags=["assistant"])
settings = get_settings()

RELIABLE_THRESHOLD = 70
UNRELIABLE_THRESHOLD = 40


def _find_alternative(db: Session, near_station: Station) -> Station | None:
    candidates = (
        db.query(Station)
        .filter(Station.id != near_station.id, Station.reliability_score >= RELIABLE_THRESHOLD)
        .all()
    )
    if not candidates:
        return None
    candidates.sort(
        key=lambda s: _haversine_km(near_station.latitude, near_station.longitude, s.latitude, s.longitude)
    )
    return candidates[0]


def _rule_based_answer(db: Session, query: AssistantQuery) -> AssistantAnswer:
    question = query.question.lower()
    suggested: list = []

    if query.station_id is not None:
        station = db.query(Station).filter(Station.id == query.station_id).first()
        if station is None:
            return AssistantAnswer(answer="Je ne trouve pas cette borne dans notre base.")

        if station.current_status == StationStatus.broken or station.reliability_score < UNRELIABLE_THRESHOLD:
            alt = _find_alternative(db, station)
            msg = (
                f"Attention : {station.name} a un score de fiabilité de {station.reliability_score}/100 "
                "et a été signalée en panne récemment. Mieux vaut éviter cette borne pour l'instant."
            )
            if alt:
                msg += f" Une borne plus fiable proche : {alt.name} ({alt.reliability_score}/100)."
                suggested.append(alt.id)
            return AssistantAnswer(answer=msg, suggested_station_ids=suggested)

        if station.current_status == StationStatus.warning:
            return AssistantAnswer(
                answer=(
                    f"{station.name} a reçu des signalements récents (lente, occupée ou paiement difficile). "
                    f"Score de fiabilité actuel : {station.reliability_score}/100. Vous pouvez charger ici, "
                    "mais prévoyez un peu plus de temps."
                )
            )

        if station.reliability_score >= RELIABLE_THRESHOLD:
            return AssistantAnswer(
                answer=(
                    f"{station.name} est fiable (score {station.reliability_score}/100), vous pouvez y charger "
                    "en confiance."
                )
            )

        return AssistantAnswer(
            answer=(
                f"Pas assez de signalements récents sur {station.name} pour se prononcer. "
                "Soyez le premier à partager votre expérience !"
            )
        )

    if query.trip_distance_km is not None:
        pct = estimate_battery_percent(query.trip_distance_km)
        return AssistantAnswer(
            answer=(
                f"Pour {query.trip_distance_km:.0f} km, comptez environ {pct}% de batterie "
                "(estimation grossière basée sur une autonomie moyenne de 450 km). "
                "Prévoyez une marge de sécurité de 10-15%."
            )
        )

    if "80" in question or "100" in question or "charger" in question and "%" in question:
        return AssistantAnswer(
            answer=(
                "Pour un usage quotidien, chargez à 80% : cela préserve la batterie sur la durée. "
                "Réservez les charges à 100% aux longs trajets, juste avant de partir."
            )
        )

    if "fiable" in question or "proche" in question and query.latitude is not None and query.longitude is not None:
        stations = db.query(Station).filter(Station.reliability_score >= RELIABLE_THRESHOLD).all()
        if stations and query.latitude is not None and query.longitude is not None:
            stations.sort(
                key=lambda s: _haversine_km(query.latitude, query.longitude, s.latitude, s.longitude)
            )
            best = stations[0]
            return AssistantAnswer(
                answer=f"La borne fiable la plus proche est {best.name} ({best.reliability_score}/100).",
                suggested_station_ids=[best.id],
            )

    return AssistantAnswer(
        answer=(
            "Je peux vous aider à savoir si une borne est fiable, estimer la batterie nécessaire pour un "
            "trajet, ou vous conseiller sur la charge à 80% vs 100%. Précisez votre question !"
        )
    )


@router.post("/query", response_model=AssistantAnswer)
def query_assistant(query: AssistantQuery, db: Session = Depends(get_db)):
    if settings.use_mock_ai:
        return _rule_based_answer(db, query)

    context = _rule_based_answer(db, query).answer
    try:
        answer = call_external_ai(query.question, context)
        return AssistantAnswer(answer=answer)
    except Exception:
        return _rule_based_answer(db, query)
