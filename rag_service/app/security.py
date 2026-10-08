import secrets
from fastapi import Header, HTTPException, status
from app.config import get_settings


def verify_api_key(x_api_key: str = Header(default="")) -> None:
    """The main LMS authenticates the student; this service only trusts the LMS via a shared key."""
    expected = get_settings().service_api_key
    if not expected:  # dev mode: auth disabled
        return
    if not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid API key")
