from fastapi import FastAPI
from routes import debug_storage  # from sprint 1
from routes import db_check       # new

app = FastAPI(title="TCG Pipeline API")

@app.get("/health/live")
def health_live():
    return {"status": "ok"}

app.include_router(debug_storage.router, prefix="/debug", tags=["debug"])
app.include_router(db_check.router, tags=["db"])