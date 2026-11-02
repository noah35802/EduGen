"""Vector store access. Swap Chroma for Qdrant/pgvector by changing only this file."""
from collections import defaultdict
from functools import lru_cache
from typing import Optional

from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.config import get_settings
from app.retrieval.embeddings import get_embeddings


@lru_cache
def get_vector_store() -> Chroma:
    s = get_settings()
    return Chroma(
        collection_name=s.collection_name,
        embedding_function=get_embeddings(),
        persist_directory=s.chroma_dir,
    )


def build_access_filter(user_id: str, course_id: str, doc_ids: Optional[list[str]] = None) -> dict:
    """A student sees: shared docs of this course (or global) + their OWN private docs for this course."""
    access = {
        "$or": [
            {"$and": [{"scope": "shared"}, {"course_id": {"$in": [course_id, "global"]}}]},
            {"$and": [{"scope": "private"}, {"user_id": user_id}, {"course_id": course_id}]},
        ]
    }
    if doc_ids:
        return {"$and": [access, {"doc_id": {"$in": doc_ids}}]}
    return access


def add_chunks(chunks: list[Document]) -> None:
    get_vector_store().add_documents(chunks)


def search(query: str, k: int, flt: dict) -> list[Document]:
    return get_vector_store().similarity_search(query, k=k, filter=flt)


def delete_document(doc_id: str) -> None:
    get_vector_store()._collection.delete(where={"doc_id": doc_id})


def get_doc_metadatas(where: dict) -> list[dict]:
    res = get_vector_store()._collection.get(where=where, include=["metadatas"])
    return res.get("metadatas") or []


def list_documents(user_id: str, course_id: Optional[str] = None) -> list[dict]:
    """Aggregate chunk metadata into one row per document the user can see."""
    clauses = [{"$or": [{"scope": "shared"}, {"user_id": user_id}]}]
    if course_id:
        clauses.append({"course_id": {"$in": [course_id, "global"]}})
    where = {"$and": clauses} if len(clauses) > 1 else clauses[0]

    grouped: dict[str, dict] = {}
    counts: dict[str, int] = defaultdict(int)
    for m in get_doc_metadatas(where):
        counts[m["doc_id"]] += 1
        grouped.setdefault(m["doc_id"], m)
    return [
        {
            "doc_id": did,
            "filename": m.get("filename", ""),
            "scope": m.get("scope", ""),
            "course_id": m.get("course_id", ""),
            "user_id": m.get("user_id", ""),
            "chunks": counts[did],
        }
        for did, m in grouped.items()
    ]
