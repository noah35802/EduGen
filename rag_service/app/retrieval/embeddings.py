from functools import lru_cache
from langchain_core.embeddings import Embeddings
from app.config import get_settings


@lru_cache
def get_embeddings() -> Embeddings:
    s = get_settings()
    if s.embedding_provider == "local":
        # Free, runs on your machine. Needs: pip install langchain-huggingface sentence-transformers
        from langchain_huggingface import HuggingFaceEmbeddings

        return HuggingFaceEmbeddings(model_name=s.local_embedding_model)

    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(
        model=s.embedding_model,
        api_key=s.openai_api_key,
        max_retries=6,  # free-tier rate limits -> retry with backoff
        chunk_size=100,
    )
