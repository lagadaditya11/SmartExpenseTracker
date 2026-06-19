from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

from app.core.config import settings


class FixedWindowRateLimiter:
    """A process-local abuse guard; the edge proxy should enforce a global limit too."""

    def __init__(self) -> None:
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, request: Request, action: str) -> None:
        client = request.client.host if request.client else "unknown"
        key = f"{action}:{client}"
        now = monotonic()
        cutoff = now - settings.auth_rate_limit_window_seconds

        with self._lock:
            attempts = self._attempts[key]
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if len(attempts) >= settings.auth_rate_limit_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts. Try again later.",
                    headers={"Retry-After": str(settings.auth_rate_limit_window_seconds)},
                )
            attempts.append(now)

    def reset(self) -> None:
        with self._lock:
            self._attempts.clear()


auth_rate_limiter = FixedWindowRateLimiter()
