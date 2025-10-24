from __future__ import annotations
import httpx
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException
from core.settings import settings

# ---- Config ----
# Ximilar Collectibles Recognition API endpoints
TCG_ID_PATH = "/collectibles/v2/tcg_id"           # TCG card identification
IMG_BG_REMOVE_PATH = "/removebg/fast/removebg"     # Fast background removal
GRADING_PATH = "/card-grader/v2/grade"            # Card grading

DEFAULT_TIMEOUT = httpx.Timeout(connect=10.0, read=60.0, write=30.0, pool=10.0)
HEADERS = {"Authorization": f"Token {settings.ximilar_api_key}"}

# ---- Helpers ----
def _raise_for_status(resp: httpx.Response, ctx: str):
    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        detail = f"Ximilar {ctx} failed: {e.response.status_code} {e.response.text}"
        raise HTTPException(status_code=e.response.status_code, detail=detail) from e

def normalize_identification(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize the Ximilar Collectibles Recognition API response into a stable structure.
    Based on the Ximilar Collectibles Recognition API documentation format.
    Uses confidence threshold to determine if manual review is needed.
    """
    # Extract the first record from the response
    records = raw.get("records", [])
    if not records:
        return {"best": None, "candidates": [], "confidence": 0.0, "needsManualReview": True}

    first_record = records[0]
    objects = first_record.get("_objects", [])

    if not objects:
        return {"best": None, "candidates": [], "confidence": 0.0, "needsManualReview": True}

    # Find the card object (first one with identification)
    card_object = None
    for obj in objects:
        if obj.get("name") == "Card" and "_identification" in obj:
            card_object = obj
            break

    if not card_object:
        return {"best": None, "candidates": [], "confidence": 0.0, "needsManualReview": True}

    identification = card_object["_identification"]
    best_match = identification.get("best_match", {})
    alternatives = identification.get("alternatives", [])
    distances = identification.get("distances", [])

    # Calculate confidence for best match
    best_confidence = 1.0 - distances[0] if distances else 0.0

    # Normalize the best match
    normalized_best = {
        "name": best_match.get("name"),
        "set": best_match.get("set"),
        "set_code": best_match.get("set_code"),
        "number": best_match.get("card_number"),
        "rarity": best_match.get("rarity"),
        "year": best_match.get("year"),
        "type": best_match.get("type"),
        "subcategory": best_match.get("subcategory"),
        "series": best_match.get("series"),
        "full_name": best_match.get("full_name"),
        "confidence": best_confidence,
        "links": best_match.get("links", {})
    }

    # Check if confidence meets threshold
    meets_threshold = best_confidence >= settings.id_confidence_threshold

    # Create candidates list based on confidence threshold
    if meets_threshold:
        # High confidence: return only the best match
        candidates = [normalized_best]
        needs_manual_review = False
    else:
        # Low confidence: return all candidates for manual review
        candidates = [normalized_best]
        for i, alt in enumerate(alternatives):
            alt_confidence = 1.0 - distances[i + 1] if len(distances) > i + 1 else 0.0
            candidates.append({
                "name": alt.get("name"),
                "set": alt.get("set"),
                "set_code": alt.get("set_code"),
                "number": alt.get("card_number"),
                "rarity": alt.get("rarity"),
                "year": alt.get("year"),
                "type": alt.get("type"),
                "subcategory": alt.get("subcategory"),
                "series": alt.get("series"),
                "full_name": alt.get("full_name"),
                "confidence": alt_confidence,
                "links": alt.get("links", {})
            })
        needs_manual_review = True

    return {
        "best": normalized_best,
        "candidates": candidates,
        "confidence": best_confidence,
        "needsManualReview": needs_manual_review
    }

# ---- API calls ----
async def identify_card(image_bytes: bytes) -> Dict[str, Any]:
    """
    Call Ximilar tcg_id model with a single image and return normalized result.
    """
    if not settings.ximilar_api_key:
        raise HTTPException(500, "Ximilar API key is not configured.")
    
    # Mock response for testing when using placeholder key
    if settings.ximilar_api_key == "replace_me":
        mock_confidence = 0.94
        meets_threshold = mock_confidence >= settings.id_confidence_threshold
        
        return {
            "best": {
                "name": "Charizard",
                "set": "Base Set",
                "set_code": "BS",
                "number": "4",
                "rarity": "Rare Holo",
                "year": 1999,
                "type": "Pokemon",
                "subcategory": "Pokemon",
                "series": "Classic",
                "full_name": "Charizard Base Set (BS) #4",
                "confidence": mock_confidence,
                "links": {
                    "tcgplayer.com": "https://www.tcgplayer.com/product/12345",
                    "ebay.com": "https://www.ebay.com/sch/i.html?_nkw=Charizard+Base+Set"
                }
            },
            "candidates": [{
                "name": "Charizard",
                "set": "Base Set",
                "set_code": "BS",
                "number": "4",
                "rarity": "Rare Holo",
                "year": 1999,
                "type": "Pokemon",
                "subcategory": "Pokemon",
                "series": "Classic",
                "full_name": "Charizard Base Set (BS) #4",
                "confidence": mock_confidence,
                "links": {
                    "tcgplayer.com": "https://www.tcgplayer.com/product/12345",
                    "ebay.com": "https://www.ebay.com/sch/i.html?_nkw=Charizard+Base+Set"
                }
            }],
            "confidence": mock_confidence,
            "needsManualReview": not meets_threshold
        }
    
    async with httpx.AsyncClient(base_url=settings.ximilar_base, headers=HEADERS, timeout=DEFAULT_TIMEOUT) as cx:
        # Convert image bytes to base64
        import base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        # Use the correct Ximilar Collectibles Recognition API format
        payload = {
            "records": [
                {
                    "_base64": image_base64
                }
            ]
        }

        resp = await cx.post(
            TCG_ID_PATH,
            json=payload
        )
        _raise_for_status(resp, "identification")
        raw = resp.json()
        return normalize_identification(raw)

async def edit_image(image_bytes: bytes) -> bytes:
    """
    Background removal + crop/center. Adjust endpoint/params for your preset.
    Returns cleaned image bytes (default content-type: image/png from the service).
    """
    if not settings.ximilar_api_key:
        raise HTTPException(500, "Ximilar API key is not configured.")
    
    # Mock response for testing when using placeholder key
    if settings.ximilar_api_key == "replace_me":
        # Return a small mock image (1x1 pixel PNG)
        import base64
        mock_png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
        return mock_png
    
    async with httpx.AsyncClient(base_url=settings.ximilar_base, headers=HEADERS, timeout=DEFAULT_TIMEOUT) as cx:
        # Convert image bytes to base64
        import base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Use the correct JSON format for background removal
        payload = {
            "records": [
                {
                    "_base64": image_base64,
                    "white_background": True
                }
            ]
        }
        
        resp = await cx.post(
            IMG_BG_REMOVE_PATH,
            json=payload
        )
        _raise_for_status(resp, "image edit")
        
        # Download the processed image from the URL
        result = resp.json()
        if result.get("records") and result["records"][0].get("_output_url_whitebg"):
            image_url = result["records"][0]["_output_url_whitebg"]
            # Download the image
            download_resp = await cx.get(image_url)
            return download_resp.content
        else:
            raise HTTPException(500, "No processed image URL returned")

async def grade_card(image_bytes: bytes) -> Dict[str, Any]:
    """
    Call card grading model; returns grading JSON (per Ximilar).
    """
    if not settings.ximilar_api_key:
        raise HTTPException(500, "Ximilar API key is not configured.")
    
    # Mock response for testing when using placeholder key
    if settings.ximilar_api_key == "replace_me":
        return {
            "grade": "PSA 9",
            "centering": 9.5,
            "corners": 9.0,
            "edges": 9.0,
            "surface": 8.5,
            "overall_grade": 9.0,
            "confidence": 0.92
        }
    
    async with httpx.AsyncClient(base_url=settings.ximilar_base, headers=HEADERS, timeout=DEFAULT_TIMEOUT) as cx:
        # Convert image bytes to base64
        import base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Use the correct JSON format for card grading
        payload = {
            "records": [
                {
                    "_base64": image_base64
                }
            ]
        }
        
        resp = await cx.post(
            GRADING_PATH,
            json=payload
        )
        _raise_for_status(resp, "grading")
        return resp.json()