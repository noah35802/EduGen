# Quiz Service

A small, **stateless** AI service for the LMS. It does two things:

1. `POST /generate-quiz` - takes the teacher-selected files (PDF, DOCX, PPTX, TXT), extracts the text, and returns multiple-choice questions.
2. `POST /export-report` - takes quiz results as JSON and returns an Excel (.xlsx) report.

It has **no database, no login and no file storage**. The backend owns all of that.

---

## Run it

```bash
cp .env.example .env          # then put your ANTHROPIC_API_KEY in .env
pip install -r requirements.txt
uvicorn app.main:app --port 8002 --reload
```

Interactive docs: http://localhost:8002/docs (you can test both endpoints there).

Docker:
```bash
docker build -t quiz-service .
docker run -p 8002:8002 --env-file .env quiz-service
```

**No API key yet?** Set `MOCK_LLM=1` in `.env`. The service then returns fake questions in the real response format, so frontend and backend can integrate before the AI is wired up.

Optional security: set `SERVICE_API_KEY=secret` and callers must send the header `X-API-Key: secret`.

---

## Endpoint 1: `POST /generate-quiz`

`multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `files` | file (repeat for each file) | PDF (text-based), DOCX, PPTX, TXT. Max 25 MB each |
| `material_ids` | string (repeat for each file) | Your DB ids, **same order as `files`** |
| `num_questions` | int | 1-50, default 10 |
| `difficulty` | string | `easy`, `medium`, `hard`, `mixed` (default `medium`) |

```bash
curl -X POST http://localhost:8002/generate-quiz \
  -F "files=@chapter1.pdf" -F "files=@chapter2.pdf" \
  -F "material_ids=mat_101" -F "material_ids=mat_102" \
  -F "num_questions=10" -F "difficulty=medium"
```

**Response 200** (see `samples/generate_quiz_response.json`):
```json
{ "questions": [ { "question": "...", "options": ["A","B","C","D"], "correct_index": 2,
    "explanation": "...", "source_material_id": "mat_101", "source_name": "chapter1.pdf",
    "source_pages": "12-14" } ],
  "warnings": [] }
```
`warnings` is non-empty if fewer questions than requested could be made. Show it to the teacher.

**Errors**

| Code | Meaning | What to do |
|---|---|---|
| 400 | Bad input (count mismatch, bad difficulty, num_questions out of range) | Bug on the caller side |
| 401 | Missing/wrong `X-API-Key` | Check config |
| 413 | File too large | Tell the teacher |
| 422 | File unreadable (scanned PDF, empty, password-protected, unsupported type) or no questions generated | Show the `detail` message to the teacher |
| 500 | LLM or server problem | Show "try again" |

Generation takes roughly 10-60 seconds. Use a **120 s timeout** and a loading state.

## Endpoint 2: `POST /export-report`

JSON body (see `samples/export_report_request.json`). Returns an `.xlsx` file with sheets **Results**, **Summary**, and **Question Analysis** (only if `question_stats` is sent). Stream it to the browser as a download.

---

## Instructions for the BACKEND teammate

1. Keep the original uploaded files in your own storage. When the teacher clicks "Generate quiz", send the selected files to `/generate-quiz`.
2. Save the returned questions as a **draft** quiz. Never publish automatically; the teacher must review and edit first.
3. Store `source_name` and `source_pages` with each question so the teacher can see where it came from.
4. **Never send `correct_index` or `explanation` to students** while they take the quiz. Reveal them only after submission, if the teacher allows it.
5. **One attempt per student**: add a unique constraint on `(quiz_id, student_id)` in the attempts table.
6. Grade on the server: compare the selected index with the stored `correct_index`.
7. Enforce the timer and deadline on the server using `started_at`, not the browser clock.
8. For the Excel report, collect results from your DB and call `/export-report`. Optionally add `question_stats` (how many students got each question right).

## Instructions for the FRONTEND teammate

- **Teacher:** pick materials, number of questions, difficulty, then a loading screen, then a review/edit screen (edit text, options, correct answer, delete or add questions), then publish. Show `warnings` if present.
- **Student:** one question per page or a scroll list, a timer, a confirm-before-submit dialog, then a result screen. Disable "Start" if the student has already attempted the quiz.
- The frontend never calls this service directly. It goes through the backend.

---

## Tools for you (the quiz owner)

```bash
python scripts/check_extract.py my.pdf slides.pptx      # inspect extracted text quality
python scripts/generate_cli.py my.pdf -n 10 -d medium   # generate a quiz without a server
python -m pytest                                        # run the tests (they use the mock LLM)
```

## Known limits

- Scanned PDFs (images only) are rejected. OCR is not included.
- Very large materials are sampled: at most 12 chunks (about 6,000 characters each) are used per quiz. Change `MAX_CHUNKS_PER_QUIZ` to cover more.
- Questions come from the LLM, so a teacher should always review them before publishing.
