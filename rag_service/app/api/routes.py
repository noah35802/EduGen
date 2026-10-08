import shutil
import tempfile
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import get_settings
from app.generation.chain import answer_question
from app.ingestion.loaders import SUPPORTED_EXTENSIONS
from app.ingestion.pipeline import ingest_file
from app.retrieval import vector_store
from app.schemas import ChatRequest, ChatResponse, DocumentInfo, IngestResponse
from app.security import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


# NOTE: plain `def` routes on purpose: LangChain/OpenAI calls are blocking, so FastAPI runs them in a threadpool.


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    course_id: str = Form("global"),
    scope: Literal["private", "shared"] = Form("private"),
):
    s = get_settings()
    ext = Path(file.filename or "").suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {sorted(SUPPORTED_EXTENSIONS)}")

    with tempfile.TemporaryDirectory() as tmp:
        dest = Path(tmp) / f"upload{ext}"
        with dest.open("wb") as out:
            shutil.copyfileobj(file.file, out)
        if dest.stat().st_size > s.max_upload_mb * 1024 * 1024:
            raise HTTPException(413, f"File larger than {s.max_upload_mb} MB")
        try:
            doc_id, n = ingest_file(
                dest, original_name=file.filename, user_id=user_id, course_id=course_id, scope=scope
            )
        except ValueError as e:
            raise HTTPException(422, str(e))
    return IngestResponse(doc_id=doc_id, filename=file.filename, chunks=n, scope=scope, course_id=course_id)


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    return answer_question(
        question=req.question,
        user_id=req.user_id,
        course_id=req.course_id,
        session_id=req.session_id,
        doc_ids=req.doc_ids,
    )


@router.get("/documents", response_model=list[DocumentInfo])
def documents(user_id: str, course_id: Optional[str] = None):
    return vector_store.list_documents(user_id, course_id)


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, user_id: str):
    metas = vector_store.get_doc_metadatas({"doc_id": doc_id})
    if not metas:
        raise HTTPException(404, "Document not found")
    meta = metas[0]
    if meta.get("scope") == "shared":
        raise HTTPException(403, "Shared documents are managed via scripts/ingest_shared.py")
    if meta.get("user_id") != user_id:
        raise HTTPException(403, "You can only delete your own documents")
    vector_store.delete_document(doc_id)
    return {"deleted": doc_id}
