# EduGen AI

EduGen is a role-based learning platform with a React frontend, Express API, PostgreSQL database, and a FastAPI RAG service for AI tutoring with course-material citations.

## Getting started

Follow [SETUP.md](./SETUP.md) to install and configure the local services, PostgreSQL, and course materials. The guide covers Windows PowerShell first and macOS/Linux second.

## Validation

```powershell
npm run build
Set-Location rag_service
.\.venv\Scripts\python.exe -m pytest -q
```

For an authenticated backend integration check, see [docs/ai-tutor-rag.md](./docs/ai-tutor-rag.md).
