from fastapi import APIRouter, UploadFile, HTTPException, Query
from services.ximilar import identify_card, edit_image, grade_card
from db.repo.card_pairs import set_status_and_id
from services.description import build_listing_description

router = APIRouter()

@router.post("/id")
async def id_test(
    file: UploadFile,
    pair_id: str | None = Query(default=None, description="Optional: update this CardPair row if present")
):
    try:
        blob = await file.read()
        id_norm = await identify_card(blob)  # {best, candidates, confidence, needsManualReview}
        confidence = float(id_norm.get("confidence") or 0.0)
        flag = id_norm.get("needsManualReview", True)  # Use the flag from id_norm response

        # Optional DB write if pair_id supplied
        if pair_id:
            status = "needs_manual" if flag else "processed"
            updated = set_status_and_id(pair_id, status, id_norm)
            # (updated==False means no row found; we still return the response)
            return {
                **id_norm,
                "needsManualReview": flag,
                "pairId": pair_id,
                "dbUpdated": updated
            }

        return {**id_norm, "needsManualReview": flag}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"id_test failed: {e}")

@router.post("/edit")
async def edit_test(file: UploadFile):
    try:
        blob = await file.read()
        cleaned = await edit_image(blob)
        return {"ok": True, "bytes": len(cleaned)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"edit_test failed: {e}")

@router.post("/grade")
async def grade_test(file: UploadFile):
    try:
        blob = await file.read()
        data = await grade_card(blob)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"grade_test failed: {e}")

@router.post("/describe")
async def describe(file: UploadFile):
    try:
        blob = await file.read()

        # 1) Identify
        id_norm = await identify_card(blob)
        confidence = float(id_norm.get("confidence") or 0.0)
        flag = id_norm.get("needsManualReview", True)  # Use flag from id_norm response

        # 2) Grade (optional, but your sprint wants it)
        grade_json = await grade_card(blob)

        # 3) LLM listing
        listing = build_listing_description(
            id_norm=id_norm,
            grade_json=grade_json,
            confidence=confidence,
            needsManualReview=flag
        )
        return {
            "listing": listing,
            "confidence": confidence,
            "needsManualReview": flag,
            "id": id_norm,
            "grade": grade_json
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"describe failed: {e}")