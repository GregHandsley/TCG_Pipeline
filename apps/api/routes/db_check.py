from fastapi import APIRouter
from sqlalchemy import text
from db.core import engine

router = APIRouter()

@router.get("/db/ping")
def db_ping():
    with engine.connect() as conn:
        # simple query — returns 1
        val = conn.execute(text("SELECT 1")).scalar_one()
        return {"ok": True, "val": val}