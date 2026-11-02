from typing import List, Optional
from pydantic import BaseModel


class Question(BaseModel):
    question: str
    options: List[str]            # always exactly 4
    correct_index: int            # 0-3
    explanation: str
    source_material_id: str
    source_name: str
    source_pages: str             # e.g. "12-14" (slides for PPTX, "1" for DOCX/TXT)


class GenerateResponse(BaseModel):
    questions: List[Question]
    warnings: List[str] = []


class StudentResult(BaseModel):
    student_name: str
    student_email: str = ""
    score: int
    total: int
    time_taken_seconds: Optional[int] = None
    submitted_at: str = ""


class ReportRequest(BaseModel):
    quiz_title: str
    class_name: str
    results: List[StudentResult]
    # Optional: per-question stats so the teacher sees which questions were hardest.
    # Example item: {"question": "...", "correct_count": 12, "total_attempts": 20}
    question_stats: List[dict] = []
