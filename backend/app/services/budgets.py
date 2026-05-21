from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.expense import Expense


def month_key(value: date) -> str:
    return value.strftime("%Y-%m")


def recalculate_budget_spend(
    db: Session,
    *,
    user_id: int,
    category_id: int | None,
    month: str,
) -> None:
    if category_id is None:
        return

    budget = db.scalar(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.category_id == category_id,
            Budget.month == month,
        )
    )
    if budget is None:
        return

    total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.category_id == category_id,
            Expense.date >= date.fromisoformat(f"{month}-01"),
            Expense.date < _next_month(month),
        )
    )
    budget.spent_so_far = Decimal(total or 0)


def _next_month(month: str) -> date:
    year, month_number = (int(part) for part in month.split("-"))
    if month_number == 12:
        return date(year + 1, 1, 1)
    return date(year, month_number + 1, 1)
