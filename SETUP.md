# Local setup

This guide starts the frontend, Express backend, PostgreSQL database, and RAG service on a local machine. Quiz generation has an optional fourth service, described below.

## Windows (PowerShell)

### Prerequisites

- Git
- Node.js 18 or later (npm is included)
- Python 3.10 or later
- PostgreSQL
- A free Groq API key: <https://console.groq.com/keys>

Clone the repository and use the branch that contains this setup guide:

```powershell
git clone https://github.com/noah35802/EduGen.git
Set-Location EduGen
git checkout main
# If this guide is on another branch, check out that branch instead.
```

### 1. Create the database

Start PostgreSQL, then create a database named `edugen` using pgAdmin or `psql`:

```powershell
createdb edugen
```

If `createdb` is not on `PATH`, use pgAdmin or run `CREATE DATABASE edugen;` in `psql`. The backend creates its user and AI-tutor tables at startup; there is no database seed or pre-created backend login.

### 2. Configure and start the RAG service

```powershell
Set-Location rag_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `rag_service\.env` and set `LLM_API_KEY` to your Groq key, `LLM_MODEL` to a model available to that key, and `SERVICE_API_KEY` to a strong, private value. Keep that value for the backend configuration below. The RAG requirements install PyTorch and can take time and disk space; see the CPU-only installation tip in [rag_service/README.md](rag_service/README.md). If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process Bypass` in that terminal and activate again.

Run the setup check (it needs the configured Groq key and downloads the embedding model on first use):

```powershell
python -m scripts.check_setup
```

It should print two `[ok]` lines. To add shared course materials, first copy PDFs into the matching folders under `data\shared_docs\` (see the course list below), then run:

```powershell
python -m scripts.ingest_shared
```

Keep this terminal and start the RAG server:

```powershell
uvicorn app.main:app --reload --port 8000
```

### 3. Configure and start the backend

Open another PowerShell terminal at the repository root:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env`. Set `DATABASE_URL` to your local PostgreSQL connection string, replace `JWT_SECRET` with a strong random value, and set:

```text
RAG_SERVICE_URL=http://localhost:8000
RAG_API_KEY=<the same value as rag_service SERVICE_API_KEY>
```

The backend environment variables are:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for the `edugen` database |
| `JWT_SECRET` | Secret used to sign login tokens |
| `PORT` | Backend HTTP port (defaults to 5000) |
| `RAG_SERVICE_URL` | URL of the RAG service |
| `RAG_API_KEY` | Must match the RAG service's `SERVICE_API_KEY` |
| `TUTOR_MAX_PDFS` | Per-user private PDF limit |
| `TUTOR_MAX_PDF_MB` | Private PDF size limit |
| `MAX_RAG_UPLOAD_MB` | Shared-material upload size limit |
| `QUIZ_SERVICE_URL` | Optional quiz service URL (defaults to port 8002) |
| `QUIZ_SERVICE_API_KEY` | Optional key sent to the quiz service |

Install and run the backend:

```powershell
npm install --prefix backend
npm run dev --prefix backend
```

### 4. Configure and start the frontend

In another terminal at the repository root:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The Vite development server is at <http://localhost:5173>. If you change any `.env` file while a service is running, stop and restart that service for the changes to take effect.

### 5. Verify the app

Open these URLs:

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:5000/health>
- RAG health: <http://localhost:8000/health>
- RAG interactive API docs: <http://localhost:8000/docs>

Start services in this order: PostgreSQL, RAG, backend, then frontend. The frontend and backend can be started before or after ingesting course files, but shared materials must be ingested before they can ground answers.

### Course materials

The course IDs and corresponding folders are:

| Course | Folder |
|---|---|
| Computer Networks | `cn` |
| Database Management | `dbms` |
| Object-Oriented Programming | `oops` |
| Operating Systems | `os` |
| Data Structures | `data-structures` |
| Machine Learning | `machine-learning` |

Course documents are local data, not setup dependencies. Copy files into `rag_service\data\shared_docs\<course_id>\` and run `python -m scripts.ingest_shared` from `rag_service`, or log in as a teacher and upload materials at `/teacher/resources`. The `.gitignore` rules exclude local PDF, DOCX, and PPTX files. Ignore rules do not untrack documents already committed, so any existing tracked course files need to be removed from Git separately.

### Demo accounts

There are no seeded PostgreSQL accounts. Register a student or teacher through the app to use authenticated backend features. The frontend also has local demo-mode roles: Radhika Singhania (student), Kunal Anand (teacher), and Radhika Singhania (admin). These are UI previews only and do not provide backend authentication tokens.

### Optional quiz-generation service

Quiz generation calls a separate FastAPI service on port 8002. To enable it, open another terminal:

```powershell
Set-Location quiz-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `GROQ_API_KEY` and a compatible `LLM_MODEL` in `quiz-service\.env`, and make `SERVICE_API_KEY` match `QUIZ_SERVICE_API_KEY` in `backend\.env`. Then start it:

```powershell
uvicorn app.main:app --reload --port 8002
```

### Troubleshooting

| Symptom | What to try |
|---|---|
| `ModuleNotFoundError` | Activate the service's `.venv` and run `pip install -r requirements.txt` from that service's directory. |
| `404 model_not_found` | List models available to your Groq key and set `LLM_MODEL` to a listed chat model. From `rag_service`, run `python -c "from app.config import get_settings as g; import httpx; s=g(); r=httpx.get(s.llm_base_url+'/models', headers={'Authorization':'Bearer '+s.llm_api_key}); print([m['id'] for m in r.json()['data']])"`. |
| `no token provided` | Sign in or register with the backend. Frontend demo mode is only a UI preview and has no backend token. |
| `401 Invalid API key` | Make sure backend `RAG_API_KEY` exactly matches RAG `SERVICE_API_KEY`. For quiz calls, check the equivalent quiz-service keys. |
| Port already in use | Stop the process using that port or configure an unused port, then update the corresponding service URL. |
| First RAG run is slow | The local embedding model downloads on first use; subsequent runs reuse the cached model. |

## macOS/Linux

Install Git, Node.js 18+, Python 3.10+, PostgreSQL, and obtain a free Groq key at <https://console.groq.com/keys>. Clone the repository and select the branch containing this guide:

```bash
git clone https://github.com/noah35802/EduGen.git
cd EduGen
git checkout main  # or the branch containing this setup guide
createdb edugen
```

Configure RAG and start it:

```bash
cd rag_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set LLM_API_KEY, a valid LLM_MODEL, and a strong SERVICE_API_KEY.
python -m scripts.check_setup
# After adding course files under data/shared_docs/<course_id>/:
python -m scripts.ingest_shared
uvicorn app.main:app --reload --port 8000
```

In a second terminal, configure and start the backend:

```bash
cd EduGen
cp backend/.env.example backend/.env
# Edit backend/.env, including DATABASE_URL, JWT_SECRET,
# RAG_SERVICE_URL=http://localhost:8000, and matching RAG_API_KEY.
npm install --prefix backend
npm run dev --prefix backend
```

In a third terminal, configure and start the frontend:

```bash
cd EduGen
cp .env.example .env
npm install
npm run dev
```

For quiz generation, follow the optional quiz-service steps above using `source .venv/bin/activate`, `cp .env.example .env`, and set the matching quiz API key. Restart any service after changing its `.env`. The separate `ai-service` directory is an unimplemented scaffold in this checkout and is not part of the runnable local stack.
