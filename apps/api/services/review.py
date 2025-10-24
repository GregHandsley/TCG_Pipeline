from core.settings import settings

def needs_manual_review(confidence: float | None) -> bool:
    try:
        c = float(confidence or 0.0)
    except Exception:
        c = 0.0
    return c < float(settings.id_confidence_threshold)