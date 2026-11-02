from functools import lru_cache
from langchain_openai import ChatOpenAI
from app.config import get_settings


@lru_cache
def get_llm() -> ChatOpenAI:
    """Groq, OpenRouter, OpenAI... anything OpenAI-compatible: change LLM_BASE_URL / LLM_MODEL / LLM_API_KEY."""
    s = get_settings()
    return ChatOpenAI(
        model=s.llm_model,
        api_key=s.llm_api_key,
        base_url=s.llm_base_url,
        temperature=0.2,
        max_retries=6,  # free-tier 429s -> retry with backoff
    )
