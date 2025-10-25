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

DEFAULT_TIMEOUT = httpx.Timeout(connect=30.0, read=120.0, write=60.0, pool=30.0)
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
    Background removal using Ximilar API - completely rewritten from scratch.
    Returns cleaned image bytes with white background.
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
        import base64
        from PIL import Image
        import io
        
        # Compress image if it's too large (Ximilar has size limits)
        try:
            image = Image.open(io.BytesIO(image_bytes))
            original_size = len(image_bytes)
            
            # If image is larger than 5MB, compress it
            if original_size > 5 * 1024 * 1024:  # 5MB
                print(f"Image too large ({original_size} bytes), compressing...")
                
                # Resize if dimensions are very large
                max_dimension = 2048
                if image.width > max_dimension or image.height > max_dimension:
                    image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                    print(f"Resized to {image.width}x{image.height}")
                
                # Compress as JPEG with quality 85
                jpeg_buffer = io.BytesIO()
                if image.mode in ('RGBA', 'LA', 'P'):
                    # Convert to RGB for JPEG
                    rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                    if image.mode == 'P':
                        image = image.convert('RGBA')
                    rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                    rgb_image.save(jpeg_buffer, format='JPEG', quality=85, optimize=True)
                else:
                    image.convert('RGB').save(jpeg_buffer, format='JPEG', quality=85, optimize=True)
                
                image_bytes = jpeg_buffer.getvalue()
                print(f"Compressed from {original_size} to {len(image_bytes)} bytes")
        except Exception as e:
            print(f"Could not compress image: {e}")
            # Continue with original bytes
        
        # Convert to base64 - simple and clean
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Exact format from Ximilar documentation
        payload = {
            "records": [
                {
                    "_base64": image_base64
                }
            ],
            "white_background": True
        }
        
        print(f"Sending request to Ximilar with base64 length: {len(image_base64)}")
        
        resp = await cx.post(
            "/removebg/precise/removebg",
            json=payload
        )
        
        print(f"Ximilar response status: {resp.status_code}")
        print(f"Ximilar response: {resp.text}")
        
        if resp.status_code != 200:
            raise HTTPException(500, f"Ximilar API error: {resp.text}")
        
        result = resp.json()
        
        # Get the processed image URL (try white background first, then transparent)
        if result.get("records") and len(result["records"]) > 0:
            record = result["records"][0]
            
            # Try white background first, then fall back to transparent
            image_url = record.get("_output_url_whitebg") or record.get("_output_url")
            
            if image_url:
                # Download the processed image using a separate client without Ximilar headers
                async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as download_client:
                    download_resp = await download_client.get(image_url)
                    
                    if download_resp.status_code == 200:
                        return download_resp.content
                    else:
                        raise HTTPException(500, f"Failed to download processed image: {download_resp.status_code}")
            else:
                raise HTTPException(500, "No image URL in response")
        else:
            raise HTTPException(500, "No records in response")

async def enhance_image(image_bytes: bytes) -> bytes:
    """
    Simple, effective image enhancement that actually improves quality.
    Focus on subtle improvements that make the image better, not worse.
    """
    from PIL import Image, ImageEnhance
    import io
    
    try:
        print(f"Processing simple, effective image enhancement...")
        
        # Open the original image
        image = Image.open(io.BytesIO(image_bytes))
        print(f"Original image: {image.width}x{image.height}, mode: {image.mode}")
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Simple, effective enhancements
        # 1. Very subtle contrast enhancement
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.05)  # Just 5% more contrast
        
        # 2. Very subtle brightness adjustment
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.02)  # Just 2% brighter
        
        # 3. Very subtle color enhancement
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.03)  # Just 3% more color
        
        # 4. Very subtle sharpening
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.05)  # Just 5% sharper
        
        # Save as high-quality JPEG
        output_buffer = io.BytesIO()
        image.save(output_buffer, format='JPEG', quality=95, optimize=True)
        
        result_bytes = output_buffer.getvalue()
        print(f"Enhanced image size: {len(result_bytes)} bytes (original: {len(image_bytes)} bytes)")
        
        return result_bytes
        
    except Exception as e:
        print(f"Enhancement error: {e}")
        raise HTTPException(500, f"Image enhancement failed: {e}")

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