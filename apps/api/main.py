import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import debug_storage, db_check, ximilar_debug
from routes import review as review_routes
from routes import ai_batch

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
print(f"🔧 Loading .env from: {env_path}")
print(f"🔧 .env file exists: {env_path.exists()}")
load_dotenv(env_path)
print(f"🔧 OPENAI_API_KEY loaded: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"🔧 OPENAI_API_KEY value: {os.getenv('OPENAI_API_KEY', 'NOT_SET')[:20]}...")

app = FastAPI(title="TCG Pipeline API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health/live")
def health_live():
    return {"status": "ok"}

app.include_router(debug_storage.router, prefix="/debug", tags=["debug"])
app.include_router(db_check.router, tags=["db"])
app.include_router(ximilar_debug.router, prefix="/ximilar", tags=["ximilar"])
app.include_router(review_routes.router, tags=["review"])
app.include_router(ai_batch.router, prefix="/ai", tags=["ai-agent"])