import argparse
from decimal import Decimal
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import MetaData, Table, create_engine, func, inspect, select, text
from sqlalchemy.engine import Connection, Engine, make_url

from app.core.config import settings

BACKEND_ROOT = Path(__file__).resolve().parents[2]
COPY_ORDER = ("users", "categories", "budgets", "expenses")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Copy Smart Expense Tracker data from SQLite to an empty PostgreSQL database."
    )
    parser.add_argument("--source", required=True, help="SQLite file path or sqlite:/// URL")
    parser.add_argument(
        "--target",
        default=settings.database_url,
        help="PostgreSQL SQLAlchemy URL (defaults to DATABASE_URL)",
    )
    parser.add_argument(
        "--allow-nonempty",
        action="store_true",
        help="Attempt insertion into a non-empty target; primary-key conflicts still fail safely",
    )
    return parser.parse_args()


def normalize_source(value: str) -> str:
    if value.startswith("sqlite:"):
        return value
    return f"sqlite:///{Path(value).expanduser().resolve()}"


def migrate(source_url: str, target_url: str, allow_nonempty: bool = False) -> dict[str, int]:
    if not source_url.startswith("sqlite:"):
        raise ValueError("Source must be a SQLite database")
    if make_url(target_url).get_backend_name() != "postgresql":
        raise ValueError("Target must be PostgreSQL")

    source_engine = create_engine(source_url)
    target_engine = create_engine(target_url, pool_pre_ping=True)
    _validate_source(source_engine)
    _upgrade_target(target_url)

    source_metadata = MetaData()
    source_metadata.reflect(bind=source_engine, only=list(COPY_ORDER))
    target_metadata = MetaData()
    target_metadata.reflect(bind=target_engine, only=list(COPY_ORDER))

    with source_engine.connect() as source, target_engine.begin() as target:
        if not allow_nonempty:
            nonempty = [name for name in COPY_ORDER if _count(target, target_metadata.tables[name])]
            if nonempty:
                raise RuntimeError(f"Target is not empty: {', '.join(nonempty)}")

        expected = _snapshot(source, source_metadata)
        for name in COPY_ORDER:
            rows = [dict(row) for row in source.execute(select(source_metadata.tables[name])).mappings()]
            if rows:
                target.execute(target_metadata.tables[name].insert(), rows)

        _reset_sequences(target)
        actual = _snapshot(target, target_metadata)
        _verify(target, target_metadata, expected, actual)

    source_engine.dispose()
    target_engine.dispose()
    return actual["counts"]


def _validate_source(engine: Engine) -> None:
    existing = set(inspect(engine).get_table_names())
    missing = set(COPY_ORDER) - existing
    if missing:
        raise RuntimeError(f"Source database is missing tables: {', '.join(sorted(missing))}")


def _upgrade_target(target_url: str) -> None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.attributes["database_url"] = target_url
    command.upgrade(config, "head")


def _count(connection: Connection, table: Table) -> int:
    return int(connection.scalar(select(func.count()).select_from(table)) or 0)


def _snapshot(connection: Connection, metadata: MetaData) -> dict:
    counts = {name: _count(connection, metadata.tables[name]) for name in COPY_ORDER}
    expense_total = connection.scalar(select(func.coalesce(func.sum(metadata.tables["expenses"].c.amount), 0)))
    return {"counts": counts, "expense_total": Decimal(expense_total or 0)}


def _reset_sequences(connection: Connection) -> None:
    for table_name in COPY_ORDER:
        connection.execute(
            text(
                f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table_name}), 1), "
                f"EXISTS(SELECT 1 FROM {table_name}))"
            )
        )


def _verify(
    connection: Connection,
    metadata: MetaData,
    expected: dict,
    actual: dict,
) -> None:
    if expected != actual:
        raise RuntimeError(f"Migration verification failed: expected {expected}, got {actual}")

    categories = metadata.tables["categories"]
    expenses = metadata.tables["expenses"]
    invalid_expenses = connection.scalar(
        select(func.count())
        .select_from(
            expenses.outerjoin(
                categories,
                (expenses.c.category_id == categories.c.id)
                & (expenses.c.user_id == categories.c.user_id),
            )
        )
        .where(expenses.c.category_id.is_not(None), categories.c.id.is_(None))
    )
    if invalid_expenses:
        raise RuntimeError(f"Migration created {invalid_expenses} invalid expense/category links")


def main() -> None:
    args = parse_args()
    source_url = normalize_source(args.source)
    counts = migrate(source_url, args.target, args.allow_nonempty)
    safe_target = make_url(args.target).render_as_string(hide_password=True)
    print(f"Migration verified successfully into {safe_target}: {counts}")


if __name__ == "__main__":
    main()
