# LMS RAG Service

A standalone RAG (Retrieval-Augmented Generation) chatbot service for the AI LMS. Students upload documents,
and course material can be pre-loaded for everyone. Questions are answered **only from retrieved context**,
with citations (file name and page).

**Stack:** FastAPI · LangChain · ChromaDB · Groq (free LLM) · local sentence-transformers embeddings (free)

---

## Contents

1. [How it works (overview)](#1-how-it-works-overview)
2. [Launch steps (from scratch)](#2-launch-steps-from-scratch)
3. [Configuration (.env)](#3-configuration-env)
4. [Embedding model](#4-embedding-model)
5. [Chunking: how documents are split](#5-chunking-how-documents-are-split)
6. [How shared data is ingested](#6-how-shared-data-is-ingested)
7. [How a question is answered](#7-how-a-question-is-answered)
8. [API reference](#8-api-reference)
9. [Testing it works](#9-testing-it-works)
10. [Troubleshooting](#10-troubleshooting)
11. [Connecting to the main LMS later](#11-connecting-to-the-main-lms-later)
12. [Project layout](#12-project-layout)
13. [Free-tier notes](#13-free-tier-notes-groq--local-embeddings)
14. [Next steps](#14-next-steps)

---

## 1. How it works (overview)

RAG does **not** train a model. Documents are indexed once, and at question time the most relevant pieces
are retrieved and given to the LLM as context.

```
INGESTION (when a document is added)
  file -> extract text (per page) -> split into chunks -> embed each chunk -> store in Chroma + metadata

QUERY (when a student asks)
  question -> (rewrite using chat history) -> embed -> filtered similarity search
          -> top chunks as context -> LLM answers with citations -> answer + sources
```

Two kinds of documents live in the same vector store, separated by metadata:

| Kind                   | `scope`   | Added by                   | Visible to                                        |
| ---------------------- | --------- | -------------------------- | ------------------------------------------------- |
| Shared course material | `shared`  | `scripts/ingest_shared.py` | everyone in that course (or everyone if `global`) |
| Student uploads        | `private` | `POST /api/v1/ingest`      | only the student who uploaded it                  |

---

## 2. Launch steps (from scratch)

All commands are for **Windows PowerShell** and run inside the `rag_service` folder.

### Step 1: Prerequisites

- Python 3.10 or newer: `python --version`
- A free Groq API key: https://console.groq.com/keys (no card needed)

### Step 2: Create the virtual environment and install

```powershell
cd rag_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # prompt should now show (.venv)
pip install -r requirements.txt
```

- If activation is blocked, run `Set-ExecutionPolicy -Scope Process Bypass` and activate again.
- `requirements.txt` includes PyTorch (large download). For a smaller CPU-only install, run
  `pip install torch --index-url https://download.pytorch.org/whl/cpu` **before** `pip install -r requirements.txt`.
- macOS/Linux: `source .venv/bin/activate`

### Step 3: Configure `.env`

```powershell
copy .env.example .env
```

Open `.env` and set at least:

```
LLM_API_KEY=gsk_your_key_here
LLM_MODEL=openai/gpt-oss-120b
```

Model names on Groq change over time. To list the models your key can use:

```powershell
python -c "from app.config import get_settings as g; import httpx; s=g(); r=httpx.get(s.llm_base_url+'/models', headers={'Authorization':'Bearer '+s.llm_api_key}); print([m['id'] for m in r.json()['data']])"
```

Pick a chat model (not whisper / guard / tts models). `.env` is gitignored: never commit it.

### Step 4: Verify the setup

```powershell
python -m pytest -q                 # 3 offline tests, no key needed -> "3 passed"
python -m scripts.check_setup       # tests your Groq key + embedding model -> two [ok] lines
```

The first `check_setup` run downloads the embedding model (about 130 MB), so it can take a minute.
A warning about `HF_TOKEN` is harmless.

### Step 5: Load the shared course documents

Put files under `data/shared_docs/`, using one sub-folder per course:

```
data/shared_docs/os/Operating System Notes.pdf     -> course "os"
data/shared_docs/dbms/DBMS_Notes.pdf               -> course "dbms"
data/shared_docs/handbook.pdf                      -> course "global" (every course)
```

```powershell
python -m scripts.ingest_shared
```

You should see one `[ok] <file> -> course=<id> chunks=<n>` line per file. Details in
[section 6](#6-how-shared-data-is-ingested).

### Step 6: Start the server

```powershell
uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/health -> `{"status":"ok"}`
- Interactive API docs: http://localhost:8000/docs
- `/` returns 404 by design. Use `/docs`.
- `--reload` restarts on `.py` changes only. **After editing `.env`, stop (Ctrl+C) and start the server again.**

### Step 7: Ask a question

In `/docs`, open `POST /api/v1/chat`, click **Try it out**, set the `x-api-key` header to your
`SERVICE_API_KEY` (default `change-me`) and send:

```json
{
	"question": "What is a deadlock and how can it be prevented?",
	"user_id": "student-1",
	"course_id": "os"
}
```

The response contains `answer`, `sources` (file, page, snippet) and a `session_id`.

---

## 3. Configuration (.env)

| Variable                            | Default                          | Meaning                                                              |
| ----------------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| `LLM_API_KEY`                       | none                             | Groq (or other provider) key                                         |
| `LLM_BASE_URL`                      | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint                                       |
| `LLM_MODEL`                         | see `.env.example`               | Chat model name (must exist for your key)                            |
| `EMBEDDING_PROVIDER`                | `local`                          | `local` (free) or `openai`                                           |
| `LOCAL_EMBEDDING_MODEL`             | `BAAI/bge-small-en-v1.5`         | Local embedding model                                                |
| `OPENAI_API_KEY`, `EMBEDDING_MODEL` | none                             | Only if `EMBEDDING_PROVIDER=openai`                                  |
| `SERVICE_API_KEY`                   | `change-me`                      | Shared secret in the `X-API-Key` header. Empty = auth off (dev only) |
| `CHROMA_DIR`                        | `./data/chroma`                  | Where the vector database is stored on disk                          |
| `COLLECTION_NAME`                   | `lms_documents`                  | Base name; the embedding provider is appended                        |
| `SHARED_DOCS_DIR`                   | `./data/shared_docs`             | Folder read by `ingest_shared`                                       |
| `CHUNK_SIZE` / `CHUNK_OVERLAP`      | `800` / `120`                    | Chunking (characters)                                                |
| `TOP_K`                             | `6`                              | Chunks retrieved per question                                        |
| `MAX_UPLOAD_MB`                     | `20`                             | Upload size limit                                                    |
| `MAX_HISTORY_TURNS`                 | `6`                              | Chat turns remembered per session                                    |

---

## 4. Embedding model

| Item           | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Model          | `BAAI/bge-small-en-v1.5`                                                                  |
| Loaded through | `langchain-huggingface` (`HuggingFaceEmbeddings`) on `sentence-transformers`              |
| Runs           | locally on your machine (CPU is fine), no API key, no quota                               |
| Vector size    | 384 dimensions                                                                            |
| Download       | about 130 MB, once, on first use (cached afterwards)                                      |
| Language       | English-focused. For other languages, set `LOCAL_EMBEDDING_MODEL` to a multilingual model |

**What embeddings do:** each chunk of text is turned into a vector of numbers so that text with a similar
meaning ends up close together. The question is embedded with the same model, and the closest chunks are
retrieved. This finds relevant text even when the wording differs from the question.

**Important:** the same model must be used for ingestion and for questions. Vectors from different models
are not comparable. To prevent mix-ups, each embedding provider gets its own Chroma collection
(`lms_documents_local`, `lms_documents_openai`). If you change `LOCAL_EMBEDDING_MODEL`, delete `data/chroma`
and re-run `ingest_shared`, and ask students to re-upload private documents.

To use OpenAI embeddings instead: set `EMBEDDING_PROVIDER=openai`, `OPENAI_API_KEY`, and `EMBEDDING_MODEL`
(e.g. `text-embedding-3-small`), then re-ingest.

---

## 5. Chunking: how documents are split

Models can't search whole documents effectively, so each document is cut into smaller pieces first.

**Step 1: split by page.** The loader first produces one unit per **PDF page**, per **PowerPoint slide**, or one unit
for a whole DOCX / TXT / MD file. The page number is saved in the metadata, which is where the citation page
comes from. A chunk therefore never crosses a page boundary.

**Step 2: split by size, based on characters.** Each unit is split with LangChain's
`RecursiveCharacterTextSplitter`:

| Setting              | Value                                                                                           | Why                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `CHUNK_SIZE`         | 800 characters (roughly 150 to 200 words)                                                       | Small enough for precise retrieval, large enough to keep an idea together                                                      |
| `CHUNK_OVERLAP`      | 120 characters                                                                                  | Consecutive chunks share some text so a sentence cut at a boundary isn't lost                                                  |
| Separators, in order | paragraph break (`\n\n`), line break (`\n`), sentence end (`. `), space, then single characters | The splitter tries to break at the most natural boundary first and only falls back to smaller ones if a piece is still too big |

So a long paragraph is split at sentence boundaries, and a short paragraph stays whole. Chunk size is measured
in **characters, not tokens or words**.

**Trade-offs when tuning (`.env`):**

- Answers miss details or feel incomplete -> raise `CHUNK_SIZE` (e.g. 1200) or `TOP_K` (e.g. 8)
- Retrieved text is noisy or off-topic -> lower `CHUNK_SIZE` (e.g. 500)
- After changing chunk settings, **re-ingest** (delete `data/chroma`, run `ingest_shared`) so existing documents use the new values.

**Metadata stored on every chunk:** `doc_id`, `filename`, `page` (when available), `chunk_index`, `user_id`,
`course_id`, `scope`. This metadata powers citations and keeps students' data separate.

---

## 6. How shared data is ingested

The shared knowledge base is loaded by `scripts/ingest_shared.py`:

```powershell
python -m scripts.ingest_shared
```

For every supported file (`.pdf`, `.docx`, `.pptx`, `.txt`, `.md`) found anywhere under `data/shared_docs/`:

1. **Course assignment from the folder name.** The first sub-folder is the `course_id`
   (`data/shared_docs/os/x.pdf` -> `os`). A file placed directly in `data/shared_docs/` gets
   `course_id = "global"` and is visible in every course.
2. **Stable document ID.** `doc_id = "shared-" + hash of the relative path`. The same file always gets the same ID.
3. **Clean re-ingest.** Any existing chunks for that `doc_id` are deleted first, so re-running the script
   replaces a file instead of duplicating it.
4. **Extract text per page** (see [chunking](#5-chunking-how-documents-are-split)).
5. **Chunk, then tag** every chunk with `scope="shared"`, `course_id`, `user_id="system"`, `doc_id`, `filename`, `page`.
6. **Embed locally and store** the vectors and metadata in Chroma, persisted on disk at `data/chroma`.

**Who sees shared documents:** a question for `course_id=os` searches shared documents of course `os`
plus `global`, and that student's own private uploads for `os`. It never searches other courses.

**Good to know:**

- Run it again whenever you add or change files.
- If you **rename or delete** a file, the old chunks stay in the database (the ID is based on the path).
  To get a clean state: stop the server, delete the `data/chroma` folder, and run `ingest_shared` again.
- Scanned PDFs without a text layer produce no text and will fail (no OCR yet).
- Shared documents can't be deleted through the API on purpose. Manage them with this script.
- Student uploads follow the same pipeline through `POST /api/v1/ingest`, with `scope="private"` and the
  student's `user_id`.

---

## 7. How a question is answered

1. **Rewrite follow-ups.** If the session has history, the LLM rewrites a follow-up like "give an example"
   into a standalone question, because vector search has no memory.
2. **Embed the question** with the same local model.
3. **Filtered search.** Chroma returns the `TOP_K` (6) nearest chunks, restricted by the access filter
   (shared documents of the course or `global`, plus the student's own private documents).
4. **Build context.** The chunks are numbered `[1]..[6]` with file name and page.
5. **Grounded answer.** The LLM is told to answer only from that context, cite `[1]`, `[2]`, and say
   "I couldn't find that in your course materials" if the answer isn't there.
6. **Return** the answer, the `sources` (file, page, snippet) and the `session_id`.

If no chunks are found at all, the service replies that nothing relevant was found without calling the LLM.

---

## 8. API reference

All routes are under `/api/v1` and need the header `X-API-Key: <SERVICE_API_KEY>` (except `/health`).

| Method | Path                             | Purpose                                                                     |
| ------ | -------------------------------- | --------------------------------------------------------------------------- |
| POST   | `/ingest`                        | multipart: `file`, `user_id`, `course_id`, `scope` (`private` or `shared`)  |
| POST   | `/chat`                          | `{question, user_id, course_id, session_id?, doc_ids?}` -> answer + sources |
| GET    | `/documents?user_id=&course_id=` | documents visible to the student                                            |
| DELETE | `/documents/{doc_id}?user_id=`   | delete the student's own private document                                   |
| GET    | `/health`                        | liveness check (no key needed)                                              |

---

## 9. Testing it works

- `python -m pytest -q` -> `3 passed` (offline, fake embeddings and LLM)
- `python -m scripts.check_setup` -> two `[ok]` lines (real key and embeddings)
- `GET /api/v1/documents?user_id=student-1&course_id=os` -> lists the shared documents of course `os`
- Ask a question from your notes: the answer should cite the right file and page
- Ask the same question with a different `course_id`, e.g. `dbms`: it should say it couldn't find it
- Ask something unrelated, e.g. "Who won the 2018 World Cup?": it should refuse instead of inventing an answer
- Upload a file as `student-1`, then ask as `student-2`: they must not see it

---

## 10. Troubleshooting

| Problem                                         | Fix                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ModuleNotFoundError`                           | The venv isn't active, or you're not inside `rag_service`                                              |
| `404 model_not_found` from Groq                 | `LLM_MODEL` is wrong for your key. List models (step 3) and update `.env`, then **restart** the server |
| `500 Internal Server Error` in `/docs`          | Read the traceback in the terminal running `uvicorn`; the last line names the cause                    |
| `401` from Groq                                 | `LLM_API_KEY` is wrong or has stray quotes/spaces                                                      |
| `401 Invalid API key` in `/docs`                | The `x-api-key` header doesn't match `SERVICE_API_KEY`                                                 |
| `429` rate limit                                | Wait a minute, or switch to a smaller model; the client already retries                                |
| Changed `.env` but nothing changed              | `--reload` doesn't watch `.env`; stop and restart `uvicorn`                                            |
| `/` shows 404                                   | Expected. Use `/docs` or `/health`                                                                     |
| "No extractable text"                           | The PDF is a scan; there's no OCR yet                                                                  |
| `Unsupported file type`                         | Only pdf, docx, pptx, txt, md are supported                                                            |
| Answers say "couldn't find" for course material | Check `course_id` matches the folder name exactly (lowercase), and that `ingest_shared` ran            |

---

## 11. Connecting to the main LMS later

- **HTTP (recommended):** run this as a separate service. Copy `integration/lms_client.py` into the LMS backend and
  call `RagClient(...).chat(...)`. The LMS authenticates the student and passes `user_id` and `course_id`.
  This service never touches the LMS user database.
- **Library:** import `answer_question` from `app.generation.chain` and `ingest_file` from
  `app.ingestion.pipeline` inside the LMS process.
- Keep `SERVICE_API_KEY` on the LMS **backend** only. Never put it in frontend code.
- With a Vite frontend, either call the LMS backend, or add a dev proxy for `/api` to `http://localhost:8000`.

Data isolation is enforced in `app/retrieval/vector_store.py::build_access_filter`.

---

## 12. Project layout

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
scripts/check_setup.py    verify key + embeddings
integration/lms_client.py client for the main LMS
tests/                    offline tests: python -m pytest -q
data/shared_docs/         your shared course files (one sub-folder per course)
data/chroma/              vector database (generated, gitignored)
```

---

## 13. Free-tier notes (Groq + local embeddings)

- **LLM:** Groq's free tier needs no card but is rate-limited per organisation (console.groq.com -> Limits).
  The client retries on `429`. If you hit limits, use a smaller model from your model list.
  Don't upload sensitive documents: free-tier data privacy is not guaranteed.
- **Embeddings:** run locally, so there is no key or quota.
- **Other providers:** any OpenAI-compatible API works by changing `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`
  (e.g. OpenRouter: `https://openrouter.ai/api/v1`).

---

## 14. Next steps

- Replace Chroma with Qdrant or pgvector (only `vector_store.py` changes)
- Move `memory.py` to Redis; add streaming responses (SSE)
- Add a reranker and hybrid (BM25 + vector) search; OCR for scanned PDFs
- Evaluate with RAGAS on a Q&A set built from the shared documents
