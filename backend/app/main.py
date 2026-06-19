import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.database import database_is_ready
from app.core.logging import configure_logging
from app.core.middleware import RequestBodyLimitMiddleware, SecurityMiddleware
from app.routers import analytics, auth, categories, expenses

logger = logging.getLogger(__name__)


configure_logging()
app = FastAPI(
    title="Smart Expense Tracker API",
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

app.add_middleware(RequestBodyLimitMiddleware, max_bytes=settings.max_request_body_bytes)
app.add_middleware(SecurityMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(analytics.router)


def _error_body(request: Request, code: str, message: str, details: Any = None) -> dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "request_id": getattr(request.state, "request_id", None),
        "details": details,
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    details = None if isinstance(exc.detail, str) else exc.detail
    return JSONResponse(
        _error_body(request, f"http_{exc.status_code}", message, details),
        status_code=exc.status_code,
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        _error_body(request, "validation_error", "Request validation failed", exc.errors()),
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled_exception",
        extra={"request_id": getattr(request.state, "request_id", None)},
    )
    return JSONResponse(
        _error_body(request, "internal_error", "An unexpected error occurred"),
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@app.get("/health/live", tags=["health"])
def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"], response_model=None)
def readiness() -> JSONResponse | dict[str, str]:
    if not database_is_ready():
        return JSONResponse({"status": "unavailable"}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    return {"status": "ready"}


@app.get("/health", include_in_schema=False)
def health_compatibility() -> dict[str, str]:
    return liveness()
