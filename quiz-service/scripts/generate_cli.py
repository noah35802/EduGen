"""Generate a quiz from the command line (no server needed):
    python scripts/generate_cli.py chapter1.pdf -n 10 -d medium
Needs ANTHROPIC_API_KEY in .env (or set MOCK_LLM=1)."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv  # noqa: E402

load_dotenv()
from app.extractor import extract  # noqa: E402
from app.generator import chunk_pages, generate_quiz  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("files", nargs="+")
ap.add_argument("-n", type=int, default=10)
ap.add_argument("-d", default="medium", choices=["easy", "medium", "hard", "mixed"])
a = ap.parse_args()

chunks = []
for i, f in enumerate(a.files):
    p = Path(f)
    chunks += chunk_pages(f"mat_{i + 1}", p.name, extract(p.name, p.read_bytes()))

qs, warnings = generate_quiz(chunks, a.n, a.d)
print(json.dumps({"questions": qs, "warnings": warnings}, indent=2, ensure_ascii=False))
