"""Offline tests: fake embeddings + fake LLM, so no API key is needed."""
from pathlib import Path

import pytest
from langchain_core.embeddings import DeterministicFakeEmbedding

from app import config
from app.retrieval import embeddings as emb_module


class FakeLLM:
    def invoke(self, messages):
        class R:
            content = "Fake answer [1]"

        if (
            isinstance(messages, list)
            and "general knowledge" in messages[0].content
            and messages[0].content.rstrip().endswith("Context:")
        ):
            class GeneralAnswer:
                content = "Not from your materials. A process is a running program."

            return GeneralAnswer()
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


def test_private_documents_are_available_across_courses_but_not_to_other_users(env):
    from app.ingestion.pipeline import ingest_file
    from app.retrieval import vector_store

    private = _txt(env, "private.txt", "Private notes about operating system scheduling.")
    ingest_file(private, original_name="private.txt", user_id="alice", course_id="global")

    alice = vector_store.build_access_filter("alice", "os")
    bob = vector_store.build_access_filter("bob", "os")
    assert vector_store.search("operating system scheduling", 10, alice)
    assert vector_store.search("operating system scheduling", 10, bob) == []


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


def test_hybrid_chat_reports_general_answer_as_ungrounded(env):
    from app.generation.chain import answer_question

    result = answer_question(
        "What is a process?",
        user_id="alice",
        course_id="os",
        mode="hybrid",
    )
    assert result.answer.startswith("Not from your materials.")
    assert result.sources == []
    assert result.grounded is False


def test_hybrid_chat_reports_citations_as_grounded(env):
    from app.generation.chain import answer_question
    from app.ingestion.pipeline import ingest_file

    ingest_file(
        _txt(env, "process.txt", "A process is a program in execution."),
        original_name="process.txt",
        user_id="alice",
        course_id="os",
    )
    result = answer_question("What is a process?", user_id="alice", course_id="os", mode="hybrid")
    assert result.grounded is True
    assert result.sources[0].filename == "process.txt"


def test_shared_document_delete_requires_explicit_permission(env):
    from fastapi.testclient import TestClient
    from app.ingestion.pipeline import ingest_file
    from app.main import app

    doc_id, _ = ingest_file(
        _txt(env, "shared.txt", "Shared course material."),
        original_name="shared.txt",
        user_id="system",
        course_id="os",
        scope="shared",
    )
    client = TestClient(app)
    assert client.delete(
        f"/api/v1/documents/{doc_id}", params={"user_id": "admin"}
    ).status_code == 403
    assert client.delete(
        f"/api/v1/documents/{doc_id}",
        params={"user_id": "admin", "allow_shared": "true"},
    ).status_code == 200


def test_optional_private_document_cap(env, monkeypatch):
    from fastapi.testclient import TestClient
    from app import config
    from app.main import app

    monkeypatch.setenv("MAX_PRIVATE_DOCS_PER_USER", "1")
    config.get_settings.cache_clear()
    client = TestClient(app)
    first = client.post(
        "/api/v1/ingest",
        files={"file": ("first.txt", b"First private document")},
        data={"user_id": "alice", "scope": "private"},
    )
    second = client.post(
        "/api/v1/ingest",
        files={"file": ("second.txt", b"Second private document")},
        data={"user_id": "alice", "scope": "private"},
    )
    assert first.status_code == 200
    assert second.status_code == 429


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
