import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.rate_limit import auth_rate_limiter
from app.core.security import (
    create_access_token,
    create_csrf_token,
    create_refresh_token,
    decode_token,
    hash_password,
    token_digest,
    verify_password,
)
from app.models.auth_session import AuthSession
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserRead
from app.services.categories import seed_default_categories

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    auth_rate_limiter.check(request, "register")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        name=payload.name.strip(),
    )
    db.add(user)
    try:
        db.flush()
        seed_default_categories(db, user)
        _establish_session(response, db, user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    db.refresh(user)
    return user


@router.post("/login", response_model=UserRead)
def login(
    payload: UserLogin,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    auth_rate_limiter.check(request, "login")
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    _establish_session(response, db, user)
    db.commit()
    return user


@router.post("/refresh", response_model=UserRead)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(refresh_token or "", "refresh")
    if payload is None or not payload.get("jti"):
        _clear_auth_cookies(response)
        raise _unauthorized()

    now = datetime.now(timezone.utc)
    session = db.scalar(
        select(AuthSession).where(
            AuthSession.id == str(payload["jti"]),
            AuthSession.user_id == int(payload["sub"]),
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
        )
    )
    if session is None or not secrets.compare_digest(session.token_hash, token_digest(refresh_token or "")):
        _clear_auth_cookies(response)
        raise _unauthorized()

    user = db.get(User, int(payload["sub"]))
    if user is None:
        _clear_auth_cookies(response)
        raise _unauthorized()

    session.revoked_at = now
    _establish_session(response, db, user)
    db.commit()
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> None:
    payload = decode_token(refresh_token or "", "refresh")
    if payload and payload.get("jti"):
        session = db.get(AuthSession, str(payload["jti"]))
        if session and session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)
            db.commit()
    _clear_auth_cookies(response)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def _establish_session(response: Response, db: Session, user: User) -> None:
    session_id = str(uuid.uuid4())
    refresh_token = create_refresh_token(user.id, session_id)
    access_token = create_access_token(user.id)
    csrf_token = create_csrf_token()
    refresh_max_age = settings.refresh_token_expire_days * 24 * 60 * 60
    session = AuthSession(
        id=session_id,
        user_id=user.id,
        token_hash=token_digest(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(session)
    cookie_options = {
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "domain": settings.cookie_domain,
        "path": "/",
    }
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        **cookie_options,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        max_age=refresh_max_age,
        **cookie_options,
    )
    response.set_cookie(
        "csrf_token",
        csrf_token,
        httponly=False,
        max_age=refresh_max_age,
        **cookie_options,
    )


def _clear_auth_cookies(response: Response) -> None:
    for name in ("access_token", "refresh_token", "csrf_token"):
        response.delete_cookie(
            name,
            path="/",
            domain=settings.cookie_domain,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
        )


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session",
        headers={"WWW-Authenticate": "Bearer"},
    )
