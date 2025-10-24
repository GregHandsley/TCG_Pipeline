from fastapi import FastAPI
from routes import debug_storage, db_check, ximilar_debug
from routes import review as review_routes

app = FastAPI(title="TCG Pipeline API")

@app.get("/health/live")
def health_live():
    return {"status": "ok"}

app.include_router(debug_storage.router, prefix="/debug", tags=["debug"])
app.include_router(db_check.router, tags=["db"])
app.include_router(ximilar_debug.router, prefix="/ximilar", tags=["ximilar"])
app.include_router(review_routes.router, tags=["review"])