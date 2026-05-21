from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseList, ExpenseRead, ExpenseUpdate
from app.services.budgets import month_key, recalculate_budget_spend

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=ExpenseList)
def list_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: date | None = None,
    end_date: date | None = None,
    category_id: int | None = None,
    min_amount: Annotated[Decimal | None, Query(gt=0)] = None,
    max_amount: Annotated[Decimal | None, Query(gt=0)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ExpenseList:
    filters = [Expense.user_id == current_user.id]
    if start_date is not None:
        filters.append(Expense.date >= start_date)
    if end_date is not None:
        filters.append(Expense.date <= end_date)
    if category_id is not None:
        filters.append(Expense.category_id == category_id)
    if min_amount is not None:
        filters.append(Expense.amount >= min_amount)
    if max_amount is not None:
        filters.append(Expense.amount <= max_amount)

    total = db.scalar(select(func.count()).select_from(Expense).where(*filters)) or 0
    items = list(
        db.scalars(
            select(Expense)
            .options(joinedload(Expense.category))
            .where(*filters)
            .order_by(Expense.date.desc(), Expense.id.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    return ExpenseList(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    _assert_category_owner(db, current_user.id, payload.category_id)
    expense = Expense(user_id=current_user.id, **payload.model_dump())
    db.add(expense)
    db.flush()
    recalculate_budget_spend(
        db,
        user_id=current_user.id,
        category_id=expense.category_id,
        month=month_key(expense.date),
    )
    db.commit()
    return _get_expense(db, current_user.id, expense.id)


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    return _get_expense(db, current_user.id, expense_id)


@router.patch("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    expense = _get_expense(db, current_user.id, expense_id)
    previous_category_id = expense.category_id
    previous_month = month_key(expense.date)

    update_data = payload.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        _assert_category_owner(db, current_user.id, update_data["category_id"])

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.flush()
    recalculate_budget_spend(
        db,
        user_id=current_user.id,
        category_id=previous_category_id,
        month=previous_month,
    )
    recalculate_budget_spend(
        db,
        user_id=current_user.id,
        category_id=expense.category_id,
        month=month_key(expense.date),
    )
    db.commit()
    return _get_expense(db, current_user.id, expense.id)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    expense = _get_expense(db, current_user.id, expense_id)
    previous_category_id = expense.category_id
    previous_month = month_key(expense.date)
    db.delete(expense)
    db.flush()
    recalculate_budget_spend(
        db,
        user_id=current_user.id,
        category_id=previous_category_id,
        month=previous_month,
    )
    db.commit()


def _get_expense(db: Session, user_id: int, expense_id: int) -> Expense:
    expense = db.scalar(
        select(Expense)
        .options(joinedload(Expense.category))
        .where(Expense.id == expense_id, Expense.user_id == user_id)
    )
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


def _assert_category_owner(db: Session, user_id: int, category_id: int | None) -> None:
    if category_id is None:
        return

    category = db.scalar(
        select(Category.id).where(Category.id == category_id, Category.user_id == user_id)
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")
