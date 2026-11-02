"""Drop-in client for the MAIN LMS backend to talk to this service.
Copy this file into the LMS project (needs: pip install httpx)."""
from typing import Optional
import httpx


class RagClient:
    def __init__(self, base_url: str = "http://localhost:8000", api_key: str = "", timeout: float = 120.0):
        self._c = httpx.Client(
            base_url=f"{base_url.rstrip('/')}/api/v1",
            headers={"X-API-Key": api_key},
            timeout=timeout,
        )

    def upload(self, path: str, user_id: str, course_id: str = "global", scope: str = "private") -> dict:
        with open(path, "rb") as f:
            r = self._c.post(
                "/ingest",
                files={"file": (path.split("/")[-1].split("\\")[-1], f)},
                data={"user_id": user_id, "course_id": course_id, "scope": scope},
            )
        r.raise_for_status()
        return r.json()

    def chat(self, question: str, user_id: str, course_id: str = "global",
             session_id: Optional[str] = None, doc_ids: Optional[list] = None) -> dict:
        r = self._c.post("/chat", json={
            "question": question, "user_id": user_id, "course_id": course_id,
            "session_id": session_id, "doc_ids": doc_ids,
        })
        r.raise_for_status()
        return r.json()

    def documents(self, user_id: str, course_id: Optional[str] = None) -> list:
        r = self._c.get("/documents", params={"user_id": user_id, "course_id": course_id})
        r.raise_for_status()
        return r.json()

    def delete(self, doc_id: str, user_id: str) -> dict:
        r = self._c.delete(f"/documents/{doc_id}", params={"user_id": user_id})
        r.raise_for_status()
        return r.json()


if __name__ == "__main__":
    client = RagClient(api_key="change-me")
    up = client.upload("notes.pdf", user_id="student-1", course_id="CS101")
    print(up)
    print(client.chat("Summarise my notes", user_id="student-1", course_id="CS101"))
