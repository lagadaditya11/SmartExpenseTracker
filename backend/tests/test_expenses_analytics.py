from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.routers import analytics, auth, categories, expenses
from app.schemas.auth import UserCreate
from app.schemas.category import CategoryCreate
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


def test_expense_crud_filters_and_analytics(db_session: Session) -> None:
    user = auth.register(
        UserCreate(email="user@example.com", password="password123", name="User"),
        db_session,
    )
    category_list = categories.list_categories(db_session, user)
    food = next(category for category in category_list if category.name == "Food")
    transport = next(category for category in category_list if category.name == "Transport")

    first = expenses.create_expense(
        ExpenseCreate(
            amount="25.50",
            description="Lunch",
            date=date.today(),
            payment_method="card",
            category_id=food.id,
        ),
        db_session,
        user,
    )
    expenses.create_expense(
        ExpenseCreate(
            amount="10.00",
            description="Metro",
            date=date.today(),
            payment_method="upi",
            category_id=transport.id,
        ),
        db_session,
        user,
    )

    filtered = expenses.list_expenses(
        db_session,
        user,
        category_id=food.id,
    )
    assert filtered.total == 1
    assert filtered.items[0].description == "Lunch"

    updated = expenses.update_expense(first.id, ExpenseUpdate(amount="30.00"), db_session, user)
    assert str(updated.amount) == "30.00"

    dashboard = analytics.dashboard_summary(db_session, user)
    assert str(dashboard.current_month_total) == "40.00"
    assert dashboard.transaction_count == 2
    assert len(dashboard.category_breakdown) == 2

    expenses.delete_expense(first.id, db_session, user)
    remaining = expenses.list_expenses(db_session, user)
    assert remaining.total == 1


def test_invalid_category_rejected(db_session: Session) -> None:
    user = auth.register(
        UserCreate(email="user@example.com", password="password123", name="User"),
        db_session,
    )
    with pytest.raises(HTTPException) as invalid_error:
        expenses.create_expense(
            ExpenseCreate(
                amount="12.00",
                description="Bad category",
                date=date.today(),
                payment_method="cash",
                category_id=9999,
            ),
            db_session,
            user,
        )
    assert invalid_error.value.status_code == 400


def test_expense_category_ownership(db_session: Session) -> None:
    owner = auth.register(
        UserCreate(email="owner@example.com", password="password123", name="Owner"),
        db_session,
    )
    other = auth.register(
        UserCreate(email="other@example.com", password="password123", name="Other"),
        db_session,
    )
    private_category = categories.create_category(
        CategoryCreate(name="Private", color_hex="#111827", icon="lock"),
        db_session,
        owner,
    )

    with pytest.raises(HTTPException) as ownership_error:
        expenses.create_expense(
            ExpenseCreate(
                amount="12.00",
                description="Bad category",
                date=date.today(),
                payment_method="cash",
                category_id=private_category.id,
            ),
            db_session,
            other,
        )
    assert ownership_error.value.status_code == 400
