from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.user import User
from app.schemas.analytics import (
    BudgetUsagePoint,
    CategoryBreakdownPoint,
    DashboardSummary,
    MonthlySummaryPoint,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/monthly-summary", response_model=list[MonthlySummaryPoint])
def monthly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MonthlySummaryPoint]:
    months = _last_n_months(date.today(), 12)
    start = _month_start(months[0])
    expenses = list(
        db.scalars(
            select(Expense).where(
                Expense.user_id == current_user.id,
                Expense.date >= start,
            )
        )
    )

    totals = {month: Decimal("0.00") for month in months}
    for expense in expenses:
        key = expense.date.strftime("%Y-%m")
        if key in totals:
            totals[key] += expense.amount

    return [MonthlySummaryPoint(month=month, total=total) for month, total in totals.items()]


@router.get("/category-breakdown", response_model=list[CategoryBreakdownPoint])
def category_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryBreakdownPoint]:
    return _category_breakdown(db, current_user.id, _current_month_start(), _next_month_start(date.today()))


@router.get("/dashboard-summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    month_start = _current_month_start()
    month_end = _next_month_start(date.today())
    expenses = list(
        db.scalars(
            select(Expense).where(
                Expense.user_id == current_user.id,
                Expense.date >= month_start,
                Expense.date < month_end,
            )
        )
    )
    return DashboardSummary(
        current_month_total=sum((expense.amount for expense in expenses), Decimal("0.00")),
        transaction_count=len(expenses),
        category_breakdown=_category_breakdown(db, current_user.id, month_start, month_end),
        budget_usage=_budget_usage(db, current_user.id, date.today().strftime("%Y-%m")),
    )


def _category_breakdown(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> list[CategoryBreakdownPoint]:
    expenses = list(
        db.scalars(
            select(Expense)
            .options(joinedload(Expense.category))
            .where(
                Expense.user_id == user_id,
                Expense.date >= start_date,
                Expense.date < end_date,
            )
        )
    )

    totals: dict[int | None, CategoryBreakdownPoint] = {}
    for expense in expenses:
        key = expense.category_id
        if key not in totals:
            totals[key] = CategoryBreakdownPoint(
                category_id=expense.category_id,
                category_name=expense.category.name if expense.category else "Uncategorized",
                color_hex=expense.category.color_hex if expense.category else None,
                total=Decimal("0.00"),
            )
        totals[key].total += expense.amount

    return sorted(totals.values(), key=lambda point: point.total, reverse=True)


def _budget_usage(db: Session, user_id: int, month: str) -> list[BudgetUsagePoint]:
    budgets = list(
        db.scalars(
            select(Budget)
            .options(joinedload(Budget.category))
            .where(Budget.user_id == user_id, Budget.month == month)
        )
    )
    usage = []
    for budget in budgets:
        percent = (
            (budget.spent_so_far / budget.monthly_limit) * Decimal("100")
            if budget.monthly_limit
            else Decimal("0")
        )
        usage.append(
            BudgetUsagePoint(
                category_id=budget.category_id,
                category_name=budget.category.name,
                month=budget.month,
                spent_so_far=budget.spent_so_far,
                monthly_limit=budget.monthly_limit,
                percent_used=percent,
            )
        )
    return usage


def _current_month_start() -> date:
    today = date.today()
    return date(today.year, today.month, 1)


def _next_month_start(value: date) -> date:
    _, days = monthrange(value.year, value.month)
    next_day = value.replace(day=days) + _ONE_DAY
    return date(next_day.year, next_day.month, 1)


def _last_n_months(value: date, count: int) -> list[str]:
    year = value.year
    month = value.month
    months = []
    for _ in range(count):
        months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            year -= 1
            month = 12
    return list(reversed(months))


def _month_start(month: str) -> date:
    year, month_number = (int(part) for part in month.split("-"))
    return date(year, month_number, 1)

_ONE_DAY = timedelta(days=1)
