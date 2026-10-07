import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ["MOCK_LLM"] = "1"      # tests never call the real LLM
os.environ["SERVICE_API_KEY"] = ""
