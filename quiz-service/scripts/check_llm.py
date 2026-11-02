import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv
load_dotenv()

import app.generator as g

print("provider:", g.PROVIDER, "| model:", g.MODEL)
try:
    out = g._complete("Python is a programming language created by Guido van Rossum. " * 5, 1, "easy")
    print("SUCCESS. Model replied:\n", out[:500])
except Exception as e:   
            print(f"  AI call failed ({type(e).__name__}): {str(e)[:200]}", flush=True)
            if attempt == retries:
                raise
            time.sleep(5 * (attempt + 1))