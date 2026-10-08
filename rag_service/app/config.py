from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    embedding_provider: str = "openai"  # openai | local
    embedding_model: str = "text-embedding-3-small"
    local_embedding_model: str = "BAAI/bge-small-en-v1.5"

    service_api_key: str = ""
    chroma_dir: str = "./data/chroma"
    collection_name: str = "lms_documents"
    shared_docs_dir: str = "./data/shared_docs"

    chunk_size: int = 800
    chunk_overlap: int = 120
    top_k: int = 6
    max_upload_mb: int = 20
    max_history_turns: int = 6


@lru_cache
def get_settings() -> Settings:
    return Settings()
