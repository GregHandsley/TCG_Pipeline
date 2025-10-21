from fastapi import APIRouter, UploadFile, HTTPException
from storage.minio_adapter import put_bytes, get_bytes

router = APIRouter()

@router.get("/live")
def live():
    return {"status": "ok"}

@router.post("/upload")
async def upload_test(file: UploadFile):
    """Upload a file to MinIO at a fixed test key."""
    try:
        blob = await file.read()
        put_bytes("debug/test-upload.bin", blob, file.content_type or "application/octet-stream")
        return {"ok": True, "key": "debug/test-upload.bin", "size": len(blob)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download")
def download_test():
    """Fetch the test object and return its size (no streaming here for simplicity)."""
    try:
        data = get_bytes("debug/test-upload.bin")
        # Don’t return raw bytes to browser here; just prove it exists
        return {"ok": True, "key": "debug/test-upload.bin", "size": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))