from decimal import Decimal

from pydantic import BaseModel


class MonthlySummaryPoint(BaseModel):
    month: str
    total: Decimal


class CategoryBreakdownPoint(BaseModel):
    category_id: int | None
    category_name: str
    total: Decimal
    color_hex: str | None = None


class BudgetUsagePoint(BaseModel):
    category_id: int
    category_name: str
    month: str
    spent_so_far: Decimal
    monthly_limit: Decimal
    percent_used: Decimal


class DashboardSummary(BaseModel):
    current_month_total: Decimal
    transaction_count: int
    category_breakdown: list[CategoryBreakdownPoint]
    budget_usage: list[BudgetUsagePoint]
