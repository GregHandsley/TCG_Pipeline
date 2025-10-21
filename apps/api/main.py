from fastapi import FastAPI
from routes import debug_storage

app = FastAPI(title="TCG Pipeline API")

# Health (required by sprint)
@app.get("/health/live")
def health_live():
    return {"status": "ok"}

# Debug storage routes for Sprint 1 verification
app.include_router(debug_storage.router, prefix="/debug", tags=["debug"])