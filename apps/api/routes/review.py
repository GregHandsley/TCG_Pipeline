from fastapi import APIRouter, UploadFile, Form, HTTPException
from sqlalchemy import select
from services.ximilar import identify_card
from services.review import needs_manual_review
from db.core import SessionLocal
from models.card_pair import CardPair

router = APIRouter()

@router.post("/review/pair")
async def review_pair(
    pair_id: str = Form(...),
    front: UploadFile = Form(...)
):
    """
    Identify the card using the provided front image and update the DB status:
    - needs_manual -> status = "needs_manual"
    - else -> status = "uploaded" (or keep your current status naming)
    Returns the normalized ID result and the manual flag.
    """
    try:
        front_bytes = await front.read()
        id_norm = await identify_card(front_bytes)
        conf = float(id_norm.get("confidence") or 0.0)
        manual = needs_manual_review(conf)

        with SessionLocal() as db:
            obj = db.execute(select(CardPair).where(CardPair.id == pair_id)).scalar_one_or_none()
            if obj is None:
                # Minimal upsert so you can test; in Sprint 5 you'll have full upload path.
                obj = CardPair(
                    id=pair_id,
                    front_key=f"inbox/pairs/{pair_id}/front.jpg",  # placeholder
                    back_key=f"inbox/pairs/{pair_id}/back.jpg",    # placeholder
                    status="needs_manual" if manual else "uploaded",
                    id_json=id_norm
                )
                db.add(obj)
            else:
                obj.id_json = id_norm
                obj.status = "needs_manual" if manual else "uploaded"
            db.commit()

        return {
            "pairId": pair_id,
            "confidence": conf,
            "needsManualReview": manual,
            "best": id_norm.get("best"),
            "candidates": id_norm.get("candidates", []),
            "status": "needs_manual" if manual else "uploaded"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"review_pair failed: {e}")
