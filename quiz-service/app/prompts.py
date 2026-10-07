SYSTEM = (
    "You are an exam question writer for a school. Use ONLY the provided text. "
    "Never use outside knowledge. Respond with valid JSON only, no markdown, no commentary."
)


def build_prompt(text: str, n: int, difficulty: str) -> str:
    diff = {
        "easy": "easy: direct recall of facts and definitions",
        "medium": "medium: understanding and applying concepts",
        "hard": "hard: analysis, comparison, and multi-step reasoning",
        "mixed": "mixed: a blend of easy, medium and hard questions",
    }.get(difficulty, "medium")
    return f"""Write exactly {n} multiple-choice questions from the text below.
Difficulty: {diff}.

Rules:
- Exactly 4 options per question, exactly one correct.
- Wrong options must be plausible but clearly incorrect according to the text.
- Do not ask about anything the text does not state.
- Do not use "all of the above" or "none of the above".
- Questions must be self-contained (no "according to the passage above").
- Add a one-sentence explanation of why the correct answer is right.

Return JSON in exactly this shape:
{{"questions":[{{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}}]}}

TEXT:
\"\"\"{text}\"\"\""""
