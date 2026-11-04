# TASK: Connect the RAG service to AI Tutor (EduGen)

Branch: `feature/ai-tutor-rag`. Work phase by phase, one commit per phase.

## 0. Goal

Merge "AI Notes" into **AI Tutor** and make the tutor answer from documents:

1. A student can upload **up to 2 PDFs** from the AI Tutor. Each PDF is ingested into the RAG service as **private**
   to that student and is retrievable **only by that student**. The number of PDFs per student is tracked.
2. Every student can also use the **shared documents** uploaded by a **teacher or admin** (course material).
3. AI Tutor chat is powered by the RAG service (answers with citations: file + page).
4. The **AI Notes section is removed entirely** (its upload/summary function now lives in AI Tutor).

Related file: `rag_integration_brief.md` (generic integration brief). This file is the specific task list.

## 1. Rules for the agent (save tokens)

- Read only the files needed for the current phase. Never open `package-lock.json`, `node_modules/`, `.venv/`,
  `data/chroma/`, images, or build output.
- Find code with `git grep -n "<pattern>" -- <folder>` instead of opening many files.
- Follow existing code style, folders, libraries and the existing error format. No new dependencies unless required.
- Show a short plan before each phase, then implement. Smallest change that works.
- The RAG `X-API-Key` and the Groq key live **only in backend/RAG `.env` files**, never in frontend code or git.
- Commit `.env.example` files only, never `.env`.
- Never trust `user_id`, `course_id`, or role sent by the browser. Derive them on the backend from the authenticated user.

## 2. Current state (from the UI)

- Routes: `/student/ai-tutor` and `/student/ai-notes`. Sidebar has "AI Tutor" and "AI Notes".
- **AI Tutor** page: left panel "Conversation History" (e.g. "Merge Sort basics", "DBMS Normalization", "OS Deadlocks");
  right panel with user bubble, answer card (badge "Generated", actions Copy / Regenerate / Helpful / Not helpful, code block),
  quick-prompt chips (Explain recursion, Give me a quiz, Simplify this concept, Give me coding practice),
  input bar with attach (paperclip), mic, text field, Send, Clear. Answers currently look like mock data. **Verify.**
- **AI Notes** page: drag-and-drop upload (PDF, PPT, notes) and a "Generate Summary" button.
- Dev ports: frontend `localhost:5173`; RAG service `localhost:8000`.

Course mapping used by AI Tutor and shared course materials:

| Frontend course id | Course | RAG `course_id` |
| ------------------ | ------ | --------------- |
| `computer-networks` | Computer Networks | `cn` |
| `dbms` | Database Management | `dbms` |
| `operating-systems` | Operating Systems | `os` |
| `object-oriented-programming` | Object-Oriented Programming | `oops` |
| `data-structures` | Data Structures | `data-structures` |
| `machine-learning` | Machine Learning | `machine-learning` |

## 3. Decisions (defaults to implement; the owner may change them)

| #   | Decision                                   | Default                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | What does "cap of 2" mean?                 | At most **2 PDFs stored at a time per student**. Deleting one frees a slot. (Alternative: 2 uploads in total, ever.)                                                                                                                                                  |
| D2  | Where are a student's private PDFs usable? | In **all of that student's tutor chats**, whatever course is selected (needs RAG change R1)                                                                                                                                                                           |
| D3  | Strict or hybrid answers?                  | **Hybrid**: use documents when relevant, otherwise answer from general knowledge and label it "Not from your materials" (needs RAG change R2). The current tutor answers general questions like "Explain Merge Sort", and strict RAG would reply "couldn't find that" |
| D4  | Which shared documents does a chat search? | Shared docs of the **course selected** in the tutor, plus `global` ones. Add a course selector to AI Tutor                                                                                                                                                            |
| D5  | Student upload file types                  | **PDF only** (service supports more, but the requirement is PDF). Teachers/admins may upload pdf, docx, pptx, txt, md                                                                                                                                                 |
| D6  | Who may upload shared docs                 | Users with role `teacher` or `admin` (teachers only for their own courses, if that relation exists)                                                                                                                                                                   |

## 4. Architecture

```
Browser (Vite)  ->  EduGen backend (auth, roles, cap, DB records)  ->  RAG service (FastAPI :8000, Chroma)
```

- Private PDF: backend calls RAG `POST /ingest` with `scope=private`, `user_id=<auth user id>`, `course_id=global`.
- Shared doc: backend (teacher/admin only) calls RAG `POST /ingest` with `scope=shared`, `course_id=<mapped course id>`.
- Chat: backend calls RAG `POST /chat` with `user_id` (auth user) and `course_id` (selected, mapped and permission-checked).
- Cap and document records live in the **backend database** (authoritative). RAG holds only the vectors.

### RAG API summary (base `http://localhost:8000/api/v1`, header `X-API-Key`)

| Call                                                                 | Purpose                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `POST /ingest` multipart: `file`, `user_id`, `course_id`, `scope`    | returns `{doc_id, filename, chunks, scope, course_id}`                        |
| `POST /chat` `{question, user_id, course_id, session_id?, doc_ids?}` | returns `{answer, sources[{doc_id,filename,page,snippet,scope}], session_id}` |
| `GET /documents?user_id=&course_id=`                                 | documents visible to that user (shared + own private)                         |
| `DELETE /documents/{doc_id}?user_id=`                                | deletes the user's own private doc (shared returns 403 today)                 |

Errors: 400 bad file type, 401 bad key, 403 not allowed, 404 not found, 413 too large (20 MB), 422 no extractable text
(scanned PDF), 5xx LLM/upstream problem. Chat can take several seconds; ingest of a PDF can take 10 to 60 s (local embeddings).

## 5. Tasks

### Phase 0: Discovery (no code changes)

- [ ] Fill the facts table in `rag_integration_brief.md` section 2 (backend framework, auth middleware, how to get the current
      user id and role, upload handling, DB layer, API client, token storage, error format).
- [ ] Find: the AI Tutor page/component, the AI Notes page/route/component, the sidebar config, and where conversations
      and messages are stored today (mock or DB).
- [ ] Find the course model and the exact course ids. Build the mapping EduGen course -> RAG `course_id`
      (RAG currently has `cn`, `dbms`, `oops`, `os` and `global`). Put the mapping in one backend config file.
- [ ] Check the existing `ai-service/` folder: is it the current mock tutor backend? Reuse its route names if sensible; do not duplicate.

### Phase 1: RAG service changes (`rag_service/`)

Keep changes small and update `tests/test_pipeline.py` (offline tests must still pass: `python -m pytest -q`).

- [ ] **R1 (D2): private docs usable in any course.** In `app/retrieval/vector_store.py::build_access_filter`, change the private
      clause from `scope=private AND user_id AND course_id` to `scope=private AND user_id` (no course condition).
      Add a test: a private doc uploaded with `course_id=global` is found for the same user in course `os`, and **never** for another user.
- [ ] **R2 (D3): hybrid mode.** Add optional `mode: "strict" | "hybrid"` (default `strict`) to `ChatRequest`. In `hybrid`:
      the prompt tells the model to use the context where relevant and cite `[n]`; if the context does not cover the question,
      say so in one short sentence and then answer from general knowledge. Add `grounded: bool` to `ChatResponse`
      (true when the answer cites context). Keep `strict` behavior unchanged. Add a test with the fake LLM.
- [ ] **R3: shared delete for admins.** Allow `DELETE /documents/{doc_id}?user_id=...&allow_shared=true` to delete shared documents.
      Only the backend calls this key-protected API, and the backend checks the role. Default stays 403 for shared.
- [ ] **R4 (optional, defense in depth):** env `MAX_PRIVATE_DOCS_PER_USER` (default `0` = off). When set, `POST /ingest` with
      `scope=private` returns 429 if the user already has that many private documents.
- [ ] **R5:** update `.env.example` so `LLM_MODEL` is a model that exists on Groq (e.g. `openai/gpt-oss-120b`), update the README for R1 to R4.
- [ ] Re-run `python -m pytest -q` and `python -m scripts.check_setup`.

### Phase 2: Backend (EduGen backend)

Config

- [ ] Add env vars (and to the backend `.env.example`): `RAG_SERVICE_URL`, `RAG_API_KEY`, `TUTOR_MAX_PDFS=2`, `TUTOR_MAX_PDF_MB=20`.
      The cap must come from config, not be hard-coded.

RAG client module

- [ ] One module wrapping `ingest`, `chat`, `list`, `delete`. Sets `X-API-Key`, timeouts (chat about 90 s, ingest about 180 s),
      maps RAG errors to backend errors (RAG down or timeout -> 502/504 with a friendly message). Never log the key or document text.

Database

- [ ] Table/collection `tutor_documents`: `id`, `user_id`, `rag_doc_id`, `filename`, `size_bytes`, `status`
      (`processing` | `ready` | `failed`), `created_at`. Index on `user_id`.
- [ ] Table/collection for conversations/messages if none exists: `conversation(id, user_id, course_id, rag_session_id, title)`
      and messages (role, text, sources JSON, grounded flag, created_at). Persist history in the backend,
      because the RAG chat memory is in-memory and resets on restart.

Student routes (names are examples; follow existing conventions; all require an authenticated student)

- [ ] `POST /api/ai-tutor/documents` (multipart `file`):
    - validate: extension `.pdf`, MIME `application/pdf`, file starts with `%PDF-`, size <= `TUTOR_MAX_PDF_MB`
    - enforce the cap **atomically**: in a transaction count the student's rows with status `processing` or `ready`;
      if `>= TUTOR_MAX_PDFS` return **409/429 with `{code: "PDF_LIMIT_REACHED", limit, used}`**. Insert a `processing` row to reserve the slot
      _before_ calling RAG so two simultaneous uploads can't both pass
    - call RAG `ingest` (`scope=private`, `user_id`, `course_id=global`); on success store `rag_doc_id`, set `ready`;
      on failure delete the reserved row (and map 422 to "this PDF has no readable text (scanned?)")
    - if the DB update fails after RAG succeeded, call RAG delete to clean up
- [ ] `GET /api/ai-tutor/documents?courseId=` returns
      `{ limit, used, private: [{id, filename, sizeBytes, createdAt}], shared: [{id, filename, courseId}] }`
      (`shared` comes from RAG `GET /documents` filtered to `scope=shared`, for the selected course plus global).
- [ ] `DELETE /api/ai-tutor/documents/:id`: only if the row belongs to the logged-in student; call RAG delete, then delete the row (frees the slot).
- [ ] `POST /api/ai-tutor/chat` `{question, conversationId?, courseId, docIds?}`:
    - check the student may access `courseId`, map it to the RAG course id
    - if `docIds` is sent, keep only ids that belong to this student's rows or to shared docs (never trust the client)
    - call RAG `chat` with `user_id` = auth user, `mode=hybrid`, the conversation's `rag_session_id`
    - save the user message and the answer (with sources and `grounded`), return `{conversationId, answer, sources, grounded}`
- [ ] Conversation list/get/delete routes for the "Conversation History" panel if they don't exist yet.

Security

- [ ] A student must never get another student's document id, filename, or content (check in list, delete, chat).
- [ ] Rate-limit chat and upload per user (reuse existing middleware if present).

### Phase 3: Frontend, AI Tutor page

- [ ] API functions in the existing API client for the routes above.
- [ ] **Course selector** in AI Tutor (enrolled courses). Selected course is sent with every chat call.
- [ ] **Wire the paperclip button**: opens a file picker with `accept="application/pdf,.pdf"`.
    - client-side checks (UX only): PDF type, size limit, remaining slots
    - show progress and a "Processing..." state (ingest can take up to about a minute), then a file chip when ready
    - **counter "1/2 PDFs used"**; when at the cap, disable the paperclip with a tooltip ("Delete a PDF to upload another")
    - friendly messages for: limit reached, not a PDF, too large, no readable text, service unavailable
- [ ] **Documents panel** (in the left column under Conversation History or a popover):
    - "Your PDFs (n/2)" list with a delete button and an optional "Ask only about this PDF" toggle (sends `docIds`)
    - "Course materials" read-only list of shared documents for the selected course
- [ ] **Chat wiring**: replace the mock answer with the backend chat call. Show a loading bubble, then the answer card.
      Keep the existing UI (Copy, Regenerate = resend the same question, quick-prompt chips send their text, Clear).
- [ ] **Sources**: under each answer show citations (`filename, p.N`) from `sources`. Replace the static "Generated" badge with
      "From your materials" when `grounded` is true, otherwise "General answer".
- [ ] Render the answer as safe markdown (code blocks allowed, no raw HTML). Render filenames as plain text.
- [ ] Conversation History: load from the backend, selecting one restores its messages; "Clear" clears the current conversation.
- [ ] **Summarize action**: after an upload (or from the chip) add "Summarize this PDF", which sends a summary prompt with
      `docIds=[thatDoc]`. This replaces the old AI Notes "Generate Summary". Note: it summarizes the most relevant parts retrieved,
      not necessarily the whole PDF; label it accordingly.
- [ ] Empty, loading, and error states; keyboard (Enter to send); works on mobile width; matches existing styling.

### Phase 4: Remove AI Notes entirely

- [ ] Remove the "AI Notes" sidebar item, the route `/student/ai-notes`, and the page component and its files.
- [ ] Remove related API calls, mock data, types, constants, tests, and any links to it (dashboard cards, global search results,
      recommendations, breadcrumbs, route guards, i18n strings).
- [ ] Add a redirect `/student/ai-notes` -> `/student/ai-tutor` so old links still work.
- [ ] Remove any now-unused backend endpoints for AI Notes (only if nothing else uses them).
- [ ] `git grep -n -i "ai-notes\|ainotes\|AI Notes"` returns nothing (except the redirect). Build and lint pass.

### Phase 5: Shared documents by teacher/admin

- [ ] Backend: `POST /api/materials` (multipart `file`, `courseId`), role `teacher` or `admin` only
      (and teacher must own/teach that course, if that relation exists). Allowed types pdf, docx, pptx, txt, md. Calls RAG
      `ingest` with `scope=shared`, mapped `course_id`. Store a record (`uploaded_by`, `course_id`, `rag_doc_id`, `filename`).
- [ ] Backend: `GET /api/materials?courseId=` and `DELETE /api/materials/:id` (uses R3, role-checked).
- [ ] Frontend: add an upload + list + delete UI for teachers/admins in the existing course/materials area (find it in Phase 0).
      If none exists, add a small "Course materials" page for teacher/admin.
- [ ] Existing documents loaded with `python -m scripts.ingest_shared` (user `system`) must appear in the shared list too.
      Decide whether they are deletable from the UI; if not, hide the delete button for them.

### Phase 6: Tests and QA

- [ ] RAG: `python -m pytest -q` passes, including new tests for R1 to R3.
- [ ] Backend tests (or manual script): cap enforcement (3rd upload rejected), simultaneous uploads, delete frees a slot,
      non-PDF rejected, role checks on shared upload, ownership checks on delete and `docIds`.
- [ ] Manual QA checklist is in section 6.

### Phase 7: Config, docs, PR

- [ ] Update `.env.example` files (backend: 4 new vars; RAG: unchanged except R5). Update the READMEs: how to start the three servers.
- [ ] `git status` shows no `.env`, `.venv`, `data/chroma`, or document PDFs. Rotate any key that was ever committed.
- [ ] Open a PR to `main` titled "AI Tutor: RAG chat, private PDF upload (max 2), shared materials; remove AI Notes".

## 6. Acceptance criteria (manual QA)

1. Student A uploads PDF 1 and PDF 2 successfully; the counter shows 2/2 and the paperclip is disabled.
2. A third upload is rejected with a clear message, even by calling the backend API directly.
3. Student A deletes one PDF; the counter shows 1/2 and a new upload works.
4. Student A asks about content in their PDF: the answer cites that file and page.
5. Student B asks the same question: no access to A's PDF (answer is from shared/general only), and B cannot see A's files in any list.
6. Student B calling delete or chat with A's document id gets a 403/404 or no data.
7. A teacher uploads a shared document for course `os`; every student in `os` can get answers from it and sees it under "Course materials";
   a student cannot upload or delete shared documents.
8. A question unrelated to the documents returns a "General answer" (hybrid), not a fake citation.
9. A scanned or empty PDF shows the "no readable text" message and does not use up a slot.
10. Stopping the RAG service shows a friendly error and nothing crashes.
11. `/student/ai-notes` redirects to AI Tutor; no "AI Notes" remains in the sidebar or code.
12. No API key appears in frontend code, network responses, or git.

## 7. Out of scope (later)

OCR for scanned PDFs, streaming answers, Redis chat memory, reranking/hybrid search, quiz/flashcard generation from documents,
voice input (mic button), analytics for Helpful / Not helpful feedback.
