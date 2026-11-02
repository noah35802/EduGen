"""Check extraction quality on your own files:
    python scripts/test_extract.py chapter1.pdf slides.pptx notes.docx
Prints page count and the first 500 characters so you can spot garbled text."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.extractor import ExtractionError, extract  # noqa: E402

for path in sys.argv[1:]:
    print("=" * 70, f"\n{path}")
    try:
        pages = extract(Path(path).name, Path(path).read_bytes())
    except ExtractionError as e:
        print("  EXTRACTION ERROR:", e)
        continue
    total = sum(len(p.text) for p in pages)
    print(f"  pages/slides: {len(pages)} | total characters: {total}")
    print("  --- preview ---")
    print(next((p.text for p in pages if p.text), "")[:500])
