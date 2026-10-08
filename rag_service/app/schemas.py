from typing import Literal, Optional
from pydantic import BaseModel, Field


class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    scope: Literal["private", "shared"]
    course_id: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    user_id: str
    course_id: str = "global"
    session_id: Optional[str] = None
    # Optionally restrict the answer to specific documents
    doc_ids: Optional[list[str]] = None


class Source(BaseModel):
    doc_id: str
    filename: str
    page: Optional[int] = None
    snippet: str
    scope: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    session_id: str


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    scope: str
    course_id: str
    user_id: str
    chunks: int
