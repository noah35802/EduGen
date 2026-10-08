"""Per-session chat history. In-memory for now; replace with Redis/DB when integrating
(keep the same get/append interface)."""
from collections import defaultdict, deque
from threading import Lock

from app.config import get_settings


class ChatMemory:
    def __init__(self) -> None:
        self._store: dict[tuple[str, str], deque] = defaultdict(deque)
        self._lock = Lock()

    def get(self, user_id: str, session_id: str) -> list[tuple[str, str]]:
        with self._lock:
            return list(self._store[(user_id, session_id)])

    def append(self, user_id: str, session_id: str, question: str, answer: str) -> None:
        limit = get_settings().max_history_turns
        with self._lock:
            q = self._store[(user_id, session_id)]
            q.append((question, answer))
            while len(q) > limit:
                q.popleft()


memory = ChatMemory()
