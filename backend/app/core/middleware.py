import secrets
import uuid
import logging
from time import perf_counter
from collections.abc import Awaitable, Callable

from starlette.datastructures import Headers, MutableHeaders
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import settings


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        content_length = headers.get("content-length")
        if content_length and int(content_length) > self.max_bytes:
            await self._reject(scope, receive, send)
            return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    raise RequestTooLargeError
            return message

        try:
            await self.app(scope, limited_receive, send)
        except RequestTooLargeError:
            await self._reject(scope, receive, send)

    @staticmethod
    async def _reject(scope: Scope, receive: Receive, send: Send) -> None:
        response = JSONResponse(
            {"code": "request_too_large", "message": "Request body is too large", "details": None},
            status_code=413,
        )
        await response(scope, receive, send)


class RequestTooLargeError(Exception):
    pass


class SecurityMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        request_id = headers.get("x-request-id") or str(uuid.uuid4())
        started_at = perf_counter()
        scope.setdefault("state", {})["request_id"] = request_id
        method = scope.get("method", "GET")
        path = scope.get("path", "")

        if method in {"POST", "PUT", "PATCH", "DELETE"} and path not in {
            "/auth/login",
            "/auth/register",
        }:
            cookies = headers.get("cookie", "")
            csrf_cookie = _cookie_value(cookies, "csrf_token")
            csrf_header = headers.get("x-csrf-token")
            if ("access_token=" in cookies or "refresh_token=" in cookies) and (
                not csrf_cookie
                or not csrf_header
                or not secrets.compare_digest(csrf_cookie, csrf_header)
            ):
                response = JSONResponse(
                    {
                        "code": "csrf_validation_failed",
                        "message": "CSRF validation failed",
                        "request_id": request_id,
                        "details": None,
                    },
                    status_code=403,
                )
                await response(scope, receive, send)
                return

        status_code = 500

        async def send_with_headers(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_headers = MutableHeaders(scope=message)
                response_headers["X-Request-ID"] = request_id
                response_headers["X-Content-Type-Options"] = "nosniff"
                response_headers["X-Frame-Options"] = "DENY"
                response_headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
                response_headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
                response_headers["Cache-Control"] = "no-store"
                if settings.is_production:
                    response_headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            await send(message)

        try:
            await self.app(scope, receive, send_with_headers)
        finally:
            logging.getLogger("app.access").info(
                "request_completed",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": round((perf_counter() - started_at) * 1000, 2),
                },
            )


def _cookie_value(cookie_header: str, name: str) -> str | None:
    for item in cookie_header.split(";"):
        key, separator, value = item.strip().partition("=")
        if separator and key == name:
            return value
    return None
