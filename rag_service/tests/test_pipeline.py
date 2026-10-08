"""Offline tests: fake embeddings + fake LLM, so no API key is needed."""
from pathlib import Path

import pytest
from langchain_core.embeddings import DeterministicFakeEmbedding

from app import config
from app.retrieval import embeddings as emb_module


class FakeLLM:
    def invoke(self, _):
        class R:
            content = "Fake answer [1]"
        return R()


@pytest.fixture()
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("CHROMA_DIR", str(tmp_path / "chroma"))
    monkeypatch.setenv("SERVICE_API_KEY", "")
    config.get_settings.cache_clear()
    emb_module.get_embeddings.cache_clear()
    monkeypatch.setattr(emb_module, "get_embeddings", lambda: DeterministicFakeEmbedding(size=64))

    from app.retrieval import vector_store
    vector_store.get_embeddings = lambda: DeterministicFakeEmbedding(size=64)
    vector_store.get_vector_store.cache_clear()

    from app.generation import chain
    monkeypatch.setattr(chain, "get_llm", lambda: FakeLLM())
    chain.memory._store.clear()
    yield tmp_path
    vector_store.get_vector_store.cache_clear()
    config.get_settings.cache_clear()


def _txt(tmp: Path, name: str, text: str) -> Path:
    p = tmp / name
    p.write_text(text)
    return p


def test_isolation_between_students_and_shared(env):
    from app.ingestion.pipeline import ingest_file
    from app.retrieval import vector_store

    a = _txt(env, "a.txt", "Alice private notes about photosynthesis and chlorophyll.")
    b = _txt(env, "b.txt", "Bob private notes about photosynthesis and chlorophyll.")
    s = _txt(env, "s.txt", "Shared lecture on photosynthesis and chlorophyll.")
    ingest_file(a, original_name="a.txt", user_id="alice", course_id="BIO")
    ingest_file(b, original_name="b.txt", user_id="bob", course_id="BIO")
    ingest_file(s, original_name="s.txt", user_id="system", course_id="BIO", scope="shared")

    flt = vector_store.build_access_filter("alice", "BIO")
    names = {d.metadata["filename"] for d in vector_store.search("photosynthesis", 10, flt)}
    assert names == {"a.txt", "s.txt"}  # never b.txt


def test_chat_returns_sources_and_handles_empty(env):
    from app.generation.chain import answer_question
    from app.ingestion.pipeline import ingest_file

    empty = answer_question("anything?", user_id="alice", course_id="BIO")
    assert empty.sources == []

    ingest_file(_txt(env, "n.txt", "Mitochondria produce ATP."), original_name="n.txt", user_id="alice", course_id="BIO")
    res = answer_question("What produces ATP?", user_id="alice", course_id="BIO", session_id="s1")
    assert res.answer and res.sources and res.sources[0].filename == "n.txt"
    # follow-up works with history (goes through condense step)
    res2 = answer_question("and where?", user_id="alice", course_id="BIO", session_id="s1")
    assert res2.session_id == "s1"


def test_api_ingest_list_delete(env):
    from fastapi.testclient import TestClient
    from app.main import app

    c = TestClient(app)
    r = c.post("/api/v1/ingest", files={"file": ("x.txt", b"Hello RAG world")},
               data={"user_id": "alice", "course_id": "CS"})
    assert r.status_code == 200, r.text
    doc_id = r.json()["doc_id"]

    docs = c.get("/api/v1/documents", params={"user_id": "alice"}).json()
    assert [d["doc_id"] for d in docs] == [doc_id]
    assert c.get("/api/v1/documents", params={"user_id": "bob"}).json() == []

    assert c.delete(f"/api/v1/documents/{doc_id}", params={"user_id": "bob"}).status_code == 403
    assert c.delete(f"/api/v1/documents/{doc_id}", params={"user_id": "alice"}).status_code == 200
    assert c.post("/api/v1/ingest", files={"file": ("x.exe", b"nope")}, data={"user_id": "alice"}).status_code == 400
