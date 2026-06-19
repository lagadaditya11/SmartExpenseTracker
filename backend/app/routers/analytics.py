from calendar import monthrange
from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.budget import Budget
from app.models.category import Category
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
    months = _last_n_months(_today(), 12)
    start = _month_start(months[0])
    year = extract("year", Expense.date)
    month_number = extract("month", Expense.date)
    rows = db.execute(
        select(year, month_number, func.sum(Expense.amount))
        .where(Expense.user_id == current_user.id, Expense.date >= start)
        .group_by(year, month_number)
    )

    totals = {month: Decimal("0.00") for month in months}
    for row_year, row_month, total in rows:
        key = f"{int(row_year):04d}-{int(row_month):02d}"
        if key in totals:
            totals[key] = Decimal(total)

    return [MonthlySummaryPoint(month=month, total=total) for month, total in totals.items()]


@router.get("/category-breakdown", response_model=list[CategoryBreakdownPoint])
def category_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryBreakdownPoint]:
    return _category_breakdown(db, current_user.id, _current_month_start(), _next_month_start(_today()))


@router.get("/dashboard-summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    month_start = _current_month_start()
    month_end = _next_month_start(_today())
    current_month_total, transaction_count = db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0), func.count(Expense.id)).where(
            Expense.user_id == current_user.id,
            Expense.date >= month_start,
            Expense.date < month_end,
        )
    ).one()
    return DashboardSummary(
        current_month_total=Decimal(current_month_total),
        transaction_count=int(transaction_count),
        category_breakdown=_category_breakdown(db, current_user.id, month_start, month_end),
        budget_usage=_budget_usage(db, current_user.id, _today().strftime("%Y-%m")),
    )


def _category_breakdown(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> list[CategoryBreakdownPoint]:
    rows = db.execute(
        select(
            Expense.category_id,
            Category.name,
            Category.color_hex,
            func.sum(Expense.amount).label("total"),
        )
        .outerjoin(Category, Expense.category_id == Category.id)
        .where(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date,
        )
        .group_by(Expense.category_id, Category.name, Category.color_hex)
        .order_by(func.sum(Expense.amount).desc())
    )
    return [
        CategoryBreakdownPoint(
            category_id=category_id,
            category_name=name or "Uncategorized",
            color_hex=color_hex,
            total=Decimal(total),
        )
        for category_id, name, color_hex, total in rows
    ]


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
    today = _today()
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


def _today() -> date:
    return datetime.now(ZoneInfo(settings.app_timezone)).date()

_ONE_DAY = timedelta(days=1)
