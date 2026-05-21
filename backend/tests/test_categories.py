import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.routers import auth, categories
from app.schemas.auth import UserCreate
from app.schemas.category import CategoryCreate, CategoryUpdate


def test_default_categories_and_crud(db_session: Session) -> None:
    user = auth.register(
        UserCreate(email="user@example.com", password="password123", name="User"),
        db_session,
    )
    assert len(categories.list_categories(db_session, user)) == 6

    category = categories.create_category(
        CategoryCreate(name="Books", color_hex="#0f766e", icon="book"),
        db_session,
        user,
    )

    updated = categories.update_category(
        category.id,
        CategoryUpdate(name="Reading"),
        db_session,
        user,
    )
    assert updated.name == "Reading"

    categories.delete_category(category.id, db_session, user)
    with pytest.raises(HTTPException) as missing_error:
        categories.update_category(category.id, CategoryUpdate(name="Missing"), db_session, user)
    assert missing_error.value.status_code == 404


def test_category_ownership(db_session: Session) -> None:
    owner = auth.register(
        UserCreate(email="owner@example.com", password="password123", name="Owner"),
        db_session,
    )
    other = auth.register(
        UserCreate(email="other@example.com", password="password123", name="Other"),
        db_session,
    )
    category = categories.create_category(
        CategoryCreate(name="Private", color_hex="#111827", icon="lock"),
        db_session,
        owner,
    )

    with pytest.raises(HTTPException) as ownership_error:
        categories.update_category(category.id, CategoryUpdate(name="Stolen"), db_session, other)
    assert ownership_error.value.status_code == 404
