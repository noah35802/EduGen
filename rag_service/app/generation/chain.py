"""The RAG chat flow: condense follow-up -> retrieve (access-filtered) -> grounded answer + sources."""
import uuid
from typing import Optional

from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import get_settings
from app.generation.llm import get_llm
from app.generation.prompts import ANSWER_SYSTEM_PROMPT, CONDENSE_PROMPT
from app.memory import memory
from app.retrieval import vector_store
from app.schemas import ChatResponse, Source

NO_CONTEXT_REPLY = (
    "I couldn't find anything relevant in your course materials. "
    "Try uploading the related document or rephrasing your question."
)


def _condense(question: str, history: list[tuple[str, str]]) -> str:
    if not history:
        return question
    hist = "\n".join(f"Student: {q}\nAssistant: {a}" for q, a in history)
    prompt = CONDENSE_PROMPT.format(history=hist, question=question)
    return get_llm().invoke(prompt).content.strip() or question


def _format_context(docs: list[Document]) -> str:
    blocks = []
    for i, d in enumerate(docs, start=1):
        label = d.metadata.get("filename", "document")
        page = d.metadata.get("page")
        if page:
            label += f", p.{page}"
        blocks.append(f"[{i}] ({label})\n{d.page_content}")
    return "\n\n".join(blocks)


def answer_question(
    question: str,
    user_id: str,
    course_id: str = "global",
    session_id: Optional[str] = None,
    doc_ids: Optional[list[str]] = None,
) -> ChatResponse:
    session_id = session_id or uuid.uuid4().hex
    history = memory.get(user_id, session_id)

    standalone = _condense(question, history)
    flt = vector_store.build_access_filter(user_id, course_id, doc_ids)
    docs = vector_store.search(standalone, k=get_settings().top_k, flt=flt)

    if not docs:
        memory.append(user_id, session_id, question, NO_CONTEXT_REPLY)
        return ChatResponse(answer=NO_CONTEXT_REPLY, sources=[], session_id=session_id)

    messages = [
        SystemMessage(content=ANSWER_SYSTEM_PROMPT.format(context=_format_context(docs))),
        HumanMessage(content=standalone),
    ]
    answer = get_llm().invoke(messages).content.strip()
    memory.append(user_id, session_id, question, answer)

    sources = [
        Source(
            doc_id=d.metadata.get("doc_id", ""),
            filename=d.metadata.get("filename", ""),
            page=d.metadata.get("page"),
            snippet=d.page_content[:300],
            scope=d.metadata.get("scope", ""),
        )
        for d in docs
    ]
    return ChatResponse(answer=answer, sources=sources, session_id=session_id)
