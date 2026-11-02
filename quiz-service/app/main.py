import os
from typing import List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

load_dotenv()

from .extractor import ExtractionError, extract  # noqa: E402
from .generator import chunk_pages, generate_quiz  # noqa: E402
from .report import build_report  # noqa: E402
from .schemas import GenerateResponse, ReportRequest  # noqa: E402

MAX_MB = int(os.getenv("MAX_UPLOAD_MB", "25"))
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

app = FastAPI(title="Quiz Service", version="1.0.0")


def check_key(x_api_key: str = Header(default="")):
    required = os.getenv("SERVICE_API_KEY", "")
    if required and x_api_key != required:
        raise HTTPException(401, "Invalid or missing X-API-Key")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate-quiz", response_model=GenerateResponse, dependencies=[Depends(check_key)])
async def generate(
    files: List[UploadFile] = File(...),
    material_ids: List[str] = Form(...),   # same order as files
    num_questions: int = Form(10),
    difficulty: str = Form("medium"),
):
    if len(files) != len(material_ids):
        raise HTTPException(400, "files and material_ids must have the same length")
    if not 1 <= num_questions <= 50:
        raise HTTPException(400, "num_questions must be between 1 and 50")
    if difficulty not in ("easy", "medium", "hard", "mixed"):
        raise HTTPException(400, "difficulty must be easy, medium, hard or mixed")

    chunks = []
    for f, mid in zip(files, material_ids):
        data = await f.read()
        if len(data) > MAX_MB * 1024 * 1024:
            raise HTTPException(413, f"{f.filename} is larger than {MAX_MB} MB")
        try:
            pages = extract(f.filename or "", data)
        except ExtractionError as e:
            raise HTTPException(422, f"{f.filename}: {e}")
        chunks += chunk_pages(mid, f.filename, pages)

    questions, warnings = generate_quiz(chunks, num_questions, difficulty)
    if not questions:
        raise HTTPException(422, warnings[0] if warnings else "Generation failed")
    return {"questions": questions, "warnings": warnings}


@app.post("/export-report", dependencies=[Depends(check_key)])
def export(req: ReportRequest):
    buf = build_report(req)
    return StreamingResponse(
        buf, media_type=XLSX,
        headers={"Content-Disposition": 'attachment; filename="quiz_report.xlsx"'},
    )
