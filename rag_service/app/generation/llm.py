from functools import lru_cache
from langchain_openai import ChatOpenAI
from app.config import get_settings


@lru_cache
def get_llm() -> ChatOpenAI:
    s = get_settings()
    return ChatOpenAI(model=s.llm_model, api_key=s.openai_api_key, temperature=0.2, max_retries=6)
