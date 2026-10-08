"""Ingest the docs YOU share into the knowledge base (scope=shared).

Layout:
  data/shared_docs/<course_id>/file.pdf   -> visible to students of that course
  data/shared_docs/file.pdf               -> course_id="global" (visible to everyone)

Safe to re-run: unchanged files are replaced (same doc_id), not duplicated.
Usage:  python -m scripts.ingest_shared
"""
import hashlib
from pathlib import Path

from app.config import get_settings
from app.ingestion.loaders import SUPPORTED_EXTENSIONS
from app.ingestion.pipeline import ingest_file
from app.retrieval import vector_store


def main() -> None:
    root = Path(get_settings().shared_docs_dir)
    files = [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]
    if not files:
        print(f"No supported files found in {root}")
        return

    for path in sorted(files):
        rel = path.relative_to(root)
        course_id = rel.parts[0] if len(rel.parts) > 1 else "global"
        doc_id = "shared-" + hashlib.sha1(str(rel).encode()).hexdigest()[:16]

        vector_store.delete_document(doc_id)  # re-ingest cleanly
        _, n = ingest_file(
            path, original_name=path.name, user_id="system", course_id=course_id, scope="shared", doc_id=doc_id
        )
        print(f"[ok] {rel}  ->  course={course_id}  chunks={n}")


if __name__ == "__main__":
    main()
