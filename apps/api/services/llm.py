from __future__ import annotations
from fastapi import HTTPException
from openai import OpenAI
from core.settings import settings

_client: OpenAI | None = None

def get_client() -> OpenAI:
    global _client
    if _client is None:
        if not settings.openai_api_key:
            raise HTTPException(500, "OPENAI_API_KEY is not configured.")
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client

def generate_text(system: str, user: str) -> str:
    """
    Call OpenAI Responses API and return plain text output.
    """
    client = get_client()
    try:
        resp = client.responses.create(
            model=settings.llm_model,
            instructions=system,     # system-style context
            input=user               # main user input
        )
        # The SDK exposes a convenience property for text output:
        return resp.output_text  # joined text from all content parts
    except Exception as e:
        # Surface a clean error to the API
        raise HTTPException(502, f"LLM call failed: {e}")