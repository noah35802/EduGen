# LMS RAG Service

A standalone RAG chatbot service for the AI LMS. Students upload documents; you can also pre-load shared
course material. Questions are answered **only from retrieved context**, with citations.

**Stack:** FastAPI · LangChain · ChromaDB · OpenAI (`gpt-4o-mini` + `text-embedding-3-small`)

## 1. Setup (Windows PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # then put your OPENAI_API_KEY in .env
```

(macOS/Linux: `source .venv/bin/activate` and `cp .env.example .env`.)

## 2. Load your shared docs

Put files in `data/shared_docs/`:

```
data/shared_docs/CS101/lecture1.pdf   -> course "CS101" only
data/shared_docs/handbook.pdf         -> "global" (every course)
```

```powershell
python -m scripts.ingest_shared
```

Re-running is safe (files are replaced, not duplicated).

## 3. Run

```powershell
uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs

## 4. API (all under `/api/v1`, header `X-API-Key: <SERVICE_API_KEY>`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/ingest` | multipart: `file`, `user_id`, `course_id`, `scope` (private/shared) |
| POST | `/chat` | `{question, user_id, course_id, session_id?, doc_ids?}` -> answer + sources |
| GET | `/documents?user_id=&course_id=` | docs visible to the student |
| DELETE | `/documents/{doc_id}?user_id=` | delete own private doc |
| GET | `/health` | liveness (no key needed) |

## 5. Connecting to the main LMS later

Pick one:

- **HTTP (recommended):** run this as a separate service. Copy `integration/lms_client.py` into the LMS
  backend and call `RagClient(...).chat(...)`. The LMS authenticates the student, then passes `user_id`
  and `course_id`. This service never touches your user DB.
- **Library:** `from app.generation.chain import answer_question` and `from app.ingestion.pipeline import ingest_file`
  inside the LMS process.

Data isolation is enforced by metadata filters (`app/retrieval/vector_store.py::build_access_filter`):
a student sees shared docs of their course + global, and only **their own** private uploads.

## 6. Project layout

```
app/
  main.py                 FastAPI app
  config.py               env-driven settings
  security.py             X-API-Key check
  schemas.py              request/response models
  memory.py               per-session chat history (swap for Redis later)
  api/routes.py           endpoints
  ingestion/              loaders (pdf/docx/pptx/txt/md), chunker, pipeline
  retrieval/              embeddings, vector store + access filters
  generation/             llm, prompts, chat chain
scripts/ingest_shared.py  bulk-load shared docs
integration/lms_client.py client for the main LMS
tests/                    offline tests (no API key needed): python -m pytest -q
```

## 6b. OpenAI free-tier notes

- Free/new accounts have low rate limits (and sometimes no credits). The code retries with backoff, but if you see
  `429 insufficient_quota`, switch **embeddings** to free local ones:
  `pip install langchain-huggingface sentence-transformers` and set `EMBEDDING_PROVIDER=local` in `.env`.
  (Re-run `ingest_shared` after switching: embeddings from different models are not compatible. Delete `data/chroma` first.)
- Keep `LLM_MODEL=gpt-4o-mini` for the cheapest option.

## 7. Scaling next steps

- Replace Chroma with Qdrant/pgvector (only `vector_store.py` changes)
- Move `memory.py` to Redis; add streaming responses (SSE)
- Add a reranker and hybrid (BM25 + vector) search; OCR for scanned PDFs
- Evaluate with RAGAS on a Q&A set from your shared docs
