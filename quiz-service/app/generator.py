"""Chunking, LLM calls, validation and de-duplication."""
import json
import math
import os
import random
import re
import time
from dataclasses import dataclass

from .prompts import SYSTEM, build_prompt

PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()      # gemini | groq | openrouter | anthropic
MODEL = os.getenv("LLM_MODEL", "")
MAX_CHUNKS = int(os.getenv("MAX_CHUNKS_PER_QUIZ", "12"))
CALL_DELAY = float(os.getenv("LLM_DELAY_SECONDS", "0"))      # pause between calls (free tiers have low limits)
CHUNK_CHARS = 6000

# OpenAI-compatible endpoints: (base_url, env var holding the key)
OPENAI_COMPAT = {
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai/", "GEMINI_API_KEY"),
    "groq": ("https://api.groq.com/openai/v1", "GROQ_API_KEY"),
    "openrouter": ("https://openrouter.ai/api/v1", "OPENROUTER_API_KEY"),
}

_client = None


def _get_client():
    global _client
    if _client is None:
        if PROVIDER == "anthropic":
            from anthropic import Anthropic
            _client = Anthropic()  # reads ANTHROPIC_API_KEY
        elif PROVIDER in OPENAI_COMPAT:
            from openai import OpenAI
            base_url, key_var = OPENAI_COMPAT[PROVIDER]
            key = os.getenv(key_var)
            if not key:
                raise RuntimeError(f"{key_var} is not set in .env")
            _client = OpenAI(base_url=base_url, api_key=key)
        else:
            raise RuntimeError(f"Unknown LLM_PROVIDER '{PROVIDER}'")
    return _client


def _complete(text, n, difficulty) -> str:
    """One LLM call, returns raw text. Provider-specific."""
    if not MODEL:
        raise RuntimeError("LLM_MODEL is not set in .env")
    client = _get_client()
    prompt = build_prompt(text, n, difficulty)
    if PROVIDER == "anthropic":
        resp = client.messages.create(model=MODEL, max_tokens=4000, system=SYSTEM,
                                      messages=[{"role": "user", "content": prompt}])
        return resp.content[0].text
    resp = client.chat.completions.create(
        model=MODEL, max_tokens=4000, temperature=0.4,
        messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}])
    return resp.choices[0].message.content or ""


@dataclass
class Chunk:
    material_id: str
    material_name: str
    text: str
    page_start: int
    page_end: int


def chunk_pages(material_id, material_name, pages, size=CHUNK_CHARS):
    chunks, cur, start, last = [], "", None, None
    for p in pages:
        if not p.text.strip():
            continue
        if cur and len(cur) + len(p.text) > size:
            chunks.append(Chunk(material_id, material_name, cur, start, last))
            cur, start = "", None
        if start is None:
            start = p.number
        cur += f"\n[Page {p.number}]\n{p.text}\n"
        last = p.number
    if cur.strip():
        chunks.append(Chunk(material_id, material_name, cur, start, last))
    return chunks


def pick_chunks(chunks, max_chunks=None):
    """Cap cost: if material is huge, sample chunks evenly across it."""
    max_chunks = max_chunks or MAX_CHUNKS
    if len(chunks) <= max_chunks:
        return chunks
    step = len(chunks) / max_chunks
    return [chunks[int(i * step)] for i in range(max_chunks)]


def _parse_json(raw: str):
    raw = raw.strip()
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        raise ValueError("no JSON object found")
    return json.loads(m.group(0))["questions"]


def _mock_questions(text, n):
    words = [w for w in re.findall(r"[A-Za-z]{5,}", text)][:40] or ["alpha", "beta", "gamma", "delta"]
    out = []
    for i in range(n):
        opts = [words[(i * 4 + k) % len(words)].capitalize() + f" {k}" for k in range(4)]
        out.append({"question": f"[MOCK] Sample question {i + 1} about the material? ({text[:20].strip()!r})",
                    "options": opts, "correct_index": i % 4,
                    "explanation": "Mock explanation (MOCK_LLM=1)."})
    return out


def call_llm(text, n, difficulty, retries=3):
    if os.getenv("MOCK_LLM") == "1":
        return _mock_questions(text, n)
    for attempt in range(retries + 1):
        try:
            if CALL_DELAY:
                time.sleep(CALL_DELAY)
            return _parse_json(_complete(text, n, difficulty))
        except RuntimeError:
            raise                                   # config problem (missing key/model): fail loudly
        except (json.JSONDecodeError, ValueError, KeyError):
            continue                                # malformed output: just retry
        except Exception as e:                      # rate limit / network: back off and retry
            if attempt == retries:
                raise
            time.sleep(5 * (attempt + 1))
    return []


def is_valid(q) -> bool:
    if not isinstance(q, dict):
        return False
    o = q.get("options", [])
    if not (isinstance(q.get("question"), str) and q["question"].strip()):
        return False
    if not (isinstance(o, list) and len(o) == 4 and all(isinstance(x, str) and x.strip() for x in o)):
        return False
    if len({x.strip().lower() for x in o}) != 4:
        return False
    ci = q.get("correct_index")
    if not (isinstance(ci, int) and not isinstance(ci, bool) and 0 <= ci <= 3):
        return False
    banned = ("all of the above", "none of the above")
    if any(x.strip().lower() in banned for x in o):
        return False
    return bool(str(q.get("explanation", "")).strip())


def shuffle_options(q):
    """Remove the LLM's bias toward certain answer positions."""
    correct = q["options"][q["correct_index"]]
    random.shuffle(q["options"])
    q["correct_index"] = q["options"].index(correct)
    return q


def generate_quiz(chunks, n, difficulty):
    chunks = pick_chunks(chunks)
    if not chunks:
        return [], ["No usable text found in the selected materials."]
    per_chunk = max(1, math.ceil(n * 1.3 / len(chunks)))

    pool, seen = [], set()
    for ch in chunks:
        for q in call_llm(ch.text, per_chunk, difficulty):
            if not is_valid(q):
                continue
            key = q["question"].strip().lower()
            if key in seen:
                continue
            seen.add(key)
            q = shuffle_options(q)
            q["source_material_id"] = ch.material_id
            q["source_name"] = ch.material_name
            q["source_pages"] = (str(ch.page_start) if ch.page_start == ch.page_end
                                 else f"{ch.page_start}-{ch.page_end}")
            pool.append(q)

    random.shuffle(pool)  # mix questions from different parts of the material
    final = pool[:n]
    warnings = []
    if len(final) < n:
        warnings.append(f"Only {len(final)} of {n} questions could be generated.")
    return final, warnings