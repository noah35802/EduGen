"""load -> chunk -> tag with metadata -> embed + store."""
import uuid
from pathlib import Path
from typing import Literal, Optional

from app.ingestion.chunker import chunk_documents
from app.ingestion.loaders import load_file
from app.retrieval import vector_store


def ingest_file(
    path: Path,
    *,
    original_name: str,
    user_id: str,
    course_id: str = "global",
    scope: Literal["private", "shared"] = "private",
    doc_id: Optional[str] = None,
) -> tuple[str, int]:
    doc_id = doc_id or uuid.uuid4().hex
    docs = load_file(path, original_name)
    if not docs:
        raise ValueError("No extractable text found (scanned PDF? add OCR).")

    chunks = chunk_documents(docs)
    for i, c in enumerate(chunks):
        c.metadata.update(
            doc_id=doc_id,
            user_id=user_id,
            course_id=course_id,
            scope=scope,
            chunk_index=i,
        )
    vector_store.add_chunks(chunks)
    return doc_id, len(chunks)
