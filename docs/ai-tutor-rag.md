# AI Tutor RAG setup and verification

## Backend configuration

Add these values to the backend environment (the RAG API key must match `SERVICE_API_KEY` in `rag_service/.env`):

```dotenv
RAG_SERVICE_URL=http://127.0.0.1:8000
RAG_API_KEY=use-a-local-secret
TUTOR_MAX_PDFS=2
TUTOR_MAX_PDF_MB=20
MAX_RAG_UPLOAD_MB=20
```

`backend/.env.ai-tutor.example` contains placeholders. Keep `.env` files and real keys out of Git. The backend maps the configured course IDs to RAG scopes in `backend/src/config/aiTutor.js`. There is no enrollment/teacher-course relation in the current repository, so the configured demo courses are available to authenticated students and teachers/admins.

## Backend integration smoke test

Start PostgreSQL, the RAG service, and the backend. Create two student accounts and one teacher account; use a new student account with no private PDFs for Student A. Set these variables only in the current PowerShell session, then run the test script:

```powershell
$env:STUDENT_A_EMAIL = "student-a@example.test"
$env:STUDENT_A_PASSWORD = "..."
$env:STUDENT_B_EMAIL = "student-b@example.test"
$env:STUDENT_B_PASSWORD = "..."
$env:TEACHER_EMAIL = "teacher@example.test"
$env:TEACHER_PASSWORD = "..."
$env:AI_TUTOR_TEST_PDF = "E:\path\to\readable-test.pdf"
node backend\scripts\aiTutorSmoke.js
```

The script checks simultaneous private uploads and the cap, deletion freeing a slot, non-PDF rejection, private-document visibility/ownership, tutor chat and persisted conversation messages, and shared-material upload/list/delete role checks. It attempts to remove the test documents and conversation afterward. Use disposable accounts and a test document.

## Manual acceptance checklist

- Student A can upload two PDFs; a simultaneous third upload is rejected with `PDF_LIMIT_REACHED`.
- Deleting one of Student A's PDFs frees a slot; a new upload succeeds.
- Student B cannot list, delete, or chat using Student A's private document IDs.
- A private PDF is available to its owner in a different selected course.
- A teacher/admin can upload shared course materials; students can list them but cannot upload or delete them.
- Shared documents from the RAG ingestion script are listed without a delete action.
- Relevant answers show filename/page citations and a grounded label; general answers are labeled as not grounded in materials.
- Scanned/empty PDFs and unavailable services show a useful error without consuming an upload slot.
- `/student/ai-notes` redirects to `/student/ai-tutor`.
- No RAG API key or LLM key is present in frontend code or network responses.

The backend uses PostgreSQL as the authoritative source for the private upload cap, document ownership, and conversation history. The RAG service's optional `MAX_PRIVATE_DOCS_PER_USER` is a defense-in-depth limit; `0` disables it.
