from fastapi import APIRouter, UploadFile, HTTPException, Query
from services.ximilar import identify_card, edit_image, grade_card, enhance_image
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
        
        # Check for HEIC format and provide helpful error
        if file.filename and file.filename.lower().endswith(('.heic', '.heif')):
            raise HTTPException(400, "HEIC format not supported. Please convert your image to JPEG or PNG format first.")
        
        cleaned = await edit_image(blob)
        from fastapi.responses import Response
        return Response(content=cleaned, media_type="image/png")
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

@router.post("/enhance")
async def enhance_test(file: UploadFile):
    try:
        blob = await file.read()
        
        # Check for HEIC format and provide helpful error
        if file.filename and file.filename.lower().endswith(('.heic', '.heif')):
            raise HTTPException(400, "HEIC format not supported. Please convert your image to JPEG or PNG format first.")
        
        enhanced = await enhance_image(blob)
        from fastapi.responses import Response
        return Response(content=enhanced, media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"enhance_test failed: {e}")

@router.post("/describe")
async def describe(file: UploadFile):
    try:
        print(f"Processing file: {file.filename}, content_type: {file.content_type}")
        blob = await file.read()
        print(f"File size: {len(blob)} bytes")

        # 1) Identify
        print("Starting identification...")
        id_norm = await identify_card(blob)
        confidence = float(id_norm.get("confidence") or 0.0)
        flag = id_norm.get("needsManualReview", True)  # Use flag from id_norm response
        print(f"Identification complete. Confidence: {confidence}, Manual review: {flag}")

        # 2) Grade (optional, but your sprint wants it)
        print("Starting grading...")
        grade_json = await grade_card(blob)
        print("Grading complete")

        # 3) LLM listing
        print("Generating listing...")
        listing = build_listing_description(
            id_norm=id_norm,
            grade_json=grade_json,
            confidence=confidence,
            needsManualReview=flag
        )
        print("Listing generation complete")
        
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
        print(f"Error in describe endpoint: {e}")
        import traceback
        traceback.print_exc()
        
        # Handle specific timeout errors
        if "ReadTimeout" in str(e) or "timeout" in str(e).lower():
            raise HTTPException(504, f"Request timeout - the image may be too large or the API is slow. Try with a smaller image.")
        elif "413" in str(e) or "Request Entity Too Large" in str(e):
            raise HTTPException(413, f"Image too large - please use a smaller image (under 5MB recommended).")
        elif "no card on image" in str(e).lower() or "card detection" in str(e).lower():
            raise HTTPException(400, f"Card not detected - please ensure the image clearly shows a trading card. Try taking a photo with better lighting and make sure the card is the main subject.")
        else:
            raise HTTPException(500, f"describe failed: {e}")