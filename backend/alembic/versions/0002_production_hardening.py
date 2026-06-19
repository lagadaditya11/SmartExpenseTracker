"""production hardening

Revision ID: 0002_production_hardening
Revises: 0001_initial_schema
Create Date: 2026-06-19 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_production_hardening"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_NAMING_CONVENTION = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
}


def upgrade() -> None:
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_expires_at", "auth_sessions", ["expires_at"])

    with op.batch_alter_table("categories") as batch_op:
        batch_op.create_unique_constraint("uq_categories_id_user_id", ["id", "user_id"])

    with op.batch_alter_table("expenses", naming_convention=_NAMING_CONVENTION) as batch_op:
        batch_op.drop_constraint("fk_expenses_category_id_categories", type_="foreignkey")
        batch_op.create_foreign_key(
            "fk_expenses_category_owner",
            "categories",
            ["category_id", "user_id"],
            ["id", "user_id"],
            ondelete="RESTRICT",
        )
        batch_op.create_check_constraint("ck_expenses_amount_positive", "amount > 0")
        batch_op.create_index("ix_expenses_user_date_id", ["user_id", "date", "id"])

    with op.batch_alter_table("budgets") as batch_op:
        batch_op.create_check_constraint("ck_budgets_limit_positive", "monthly_limit > 0")
        batch_op.create_check_constraint("ck_budgets_spent_nonnegative", "spent_so_far >= 0")


def downgrade() -> None:
    with op.batch_alter_table("budgets") as batch_op:
        batch_op.drop_constraint("ck_budgets_spent_nonnegative", type_="check")
        batch_op.drop_constraint("ck_budgets_limit_positive", type_="check")

    with op.batch_alter_table("expenses") as batch_op:
        batch_op.drop_index("ix_expenses_user_date_id")
        batch_op.drop_constraint("ck_expenses_amount_positive", type_="check")
        batch_op.drop_constraint("fk_expenses_category_owner", type_="foreignkey")
        batch_op.create_foreign_key(
            "fk_expenses_category_id_categories",
            "categories",
            ["category_id"],
            ["id"],
            ondelete="SET NULL",
        )

    with op.batch_alter_table("categories") as batch_op:
        batch_op.drop_constraint("uq_categories_id_user_id", type_="unique")

    op.drop_index("ix_auth_sessions_expires_at", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
