from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "month", name="uq_budgets_user_category_month"),
        CheckConstraint("monthly_limit > 0", name="ck_budgets_limit_positive"),
        CheckConstraint("spent_so_far >= 0", name="ck_budgets_spent_nonnegative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    monthly_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    month: Mapped[str] = mapped_column(String(7), index=True, nullable=False)
    spent_so_far: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
