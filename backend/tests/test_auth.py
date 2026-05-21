import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.routers import auth, categories
from app.schemas.auth import UserCreate, UserLogin


def test_register_login_and_me(db_session: Session) -> None:
    user = auth.register(
        UserCreate(email="person@example.com", password="password123", name="Person"),
        db_session,
    )
    assert user.email == "person@example.com"
    assert user.hashed_password != "password123"

    with pytest.raises(HTTPException) as duplicate_error:
        auth.register(
            UserCreate(email="person@example.com", password="password123", name="Person"),
            db_session,
        )
    assert duplicate_error.value.status_code == 409

    token = auth.login(
        UserLogin(email="person@example.com", password="password123"),
        db_session,
    )
    assert decode_access_token(token.access_token) == user.id
    assert auth.me(user) is user


def test_default_categories_are_seeded(db_session: Session) -> None:
    user = auth.register(
        UserCreate(email="person@example.com", password="password123", name="Person"),
        db_session,
    )
    seeded = categories.list_categories(db_session, user)
    assert len(seeded) == 6
