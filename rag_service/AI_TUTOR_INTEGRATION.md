# AI Tutor RAG behavior

- Private documents are accessible to their owner in every course; shared documents remain limited to the selected course and `global`.
- `POST /api/v1/chat` accepts `mode: "strict" | "hybrid"`. The default remains `strict`. Hybrid answers use and cite relevant context, or identify a general-knowledge answer when the context is not relevant.
- Chat responses include `grounded`, which is true only when the answer cites a retrieved context excerpt.
- Shared documents remain undeletable by default. A trusted backend may pass `allow_shared=true` when deleting a shared document.
- `MAX_PRIVATE_DOCS_PER_USER=0` disables the optional RAG-level private document cap. The EduGen backend is expected to enforce its own authoritative cap.

The default model in `.env.example` is `openai/gpt-oss-120b`; configure a valid `LLM_API_KEY` in the local, untracked `.env`.
