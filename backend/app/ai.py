"""AI assistant abstraction.

MVP mode (USE_MOCK_AI=true, the default): answers come from simple rules
over our own data (reliability score, recent reports, distance heuristics).
No external API key is required.

Later: set USE_MOCK_AI=false and fill AI_API_KEY / AI_API_BASE_URL / AI_MODEL
in .env to route through any OpenAI-compatible chat completions endpoint —
`call_external_ai` below is the only place that needs to change.
"""
import httpx

from app.config import get_settings

settings = get_settings()

AVG_EV_RANGE_KM = 450  # rough single-charge range used for the "how much battery" heuristic


def estimate_battery_percent(distance_km: float) -> int:
    return max(1, min(100, round((distance_km / AVG_EV_RANGE_KM) * 100)))


def call_external_ai(question: str, context: str) -> str:
    if not settings.ai_api_key:
        raise RuntimeError("AI_API_KEY is not configured")

    response = httpx.post(
        f"{settings.ai_api_base_url}/chat/completions",
        headers={"Authorization": f"Bearer {settings.ai_api_key}"},
        json={
            "model": settings.ai_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are VoltMate's assistant, helping EV drivers with charging "
                        "stations. Be concise and practical. Context:\n" + context
                    ),
                },
                {"role": "user", "content": question},
            ],
        },
        timeout=20.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
