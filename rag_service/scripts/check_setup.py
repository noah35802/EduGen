"""Sanity check for your .env: tests the Groq key and the embedding model.
Usage:  python -m scripts.check_setup
"""
from app.config import get_settings


def main() -> None:
    s = get_settings()
    print(f"LLM:        {s.llm_model} @ {s.llm_base_url}")
    print(f"Embeddings: {s.embedding_provider}")
    if not s.llm_api_key or s.llm_api_key.endswith("..."):
        print("[FAIL] LLM_API_KEY is not set in .env")
        return

    from app.generation.llm import get_llm

    try:
        reply = get_llm().invoke("Reply with the single word: ok").content.strip()
        print(f"[ok] LLM reachable, replied: {reply!r}")
    except Exception as e:  # noqa: BLE001
        print(f"[FAIL] LLM call failed: {e}")
        return

    from app.retrieval.embeddings import get_embeddings

    try:
        vec = get_embeddings().embed_query("hello world")
        print(f"[ok] Embeddings work (vector size {len(vec)}). First run downloads the model, so it can take a minute.")
    except Exception as e:  # noqa: BLE001
        print(f"[FAIL] Embeddings failed: {e}")


if __name__ == "__main__":
    main()
