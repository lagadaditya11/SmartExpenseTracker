from datetime import date as Date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.category import CategoryRead


class ExpenseBase(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1)
    date: Date
    payment_method: str = Field(default="other", min_length=1, max_length=50)
    category_id: int | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    description: str | None = Field(default=None, min_length=1)
    date: Date | None = None
    payment_method: str | None = Field(default=None, min_length=1, max_length=50)
    category_id: int | None = None


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime
    category: CategoryRead | None = None

    model_config = {"from_attributes": True}


class ExpenseList(BaseModel):
    items: list[ExpenseRead]
    total: int
    limit: int
    offset: int
