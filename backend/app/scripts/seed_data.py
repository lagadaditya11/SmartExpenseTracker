"""Seed the database with a demo user, categories, budgets, and realistic expenses.

Usage:
    python -m app.scripts.seed_data

This performs a destructive reset: all existing data is deleted before seeding.
"""

import random
from datetime import date, timedelta

from sqlalchemy import text

from app.core.database import SessionLocal, init_local_sqlite
from app.core.security import hash_password
from app.models.auth_session import AuthSession
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.services.categories import DEFAULT_CATEGORIES

DEMO_EMAIL = "admin@example.com"
DEMO_PASSWORD = "admin123"
DEMO_NAME = "Admin User"

CATEGORY_LIMITS: dict[str, dict] = {
    "Food": {"monthly_limit": 600, "payment_methods": ("credit_card", "debit_card", "cash")},
    "Transport": {"monthly_limit": 200, "payment_methods": ("credit_card", "debit_card")},
    "Housing": {"monthly_limit": 1500, "payment_methods": ("debit_card", "credit_card")},
    "Shopping": {"monthly_limit": 300, "payment_methods": ("credit_card", "debit_card")},
    "Health": {"monthly_limit": 150, "payment_methods": ("credit_card", "debit_card", "cash")},
    "Entertainment": {"monthly_limit": 150, "payment_methods": ("credit_card", "cash")},
}

FOOD_DESCRIPTIONS = [
    "Grocery store", "Lunch at cafe", "Dinner at restaurant", "Coffee shop",
    "Pizza delivery", "Fast food", "Breakfast place", "Sushi takeout",
    "Bakery", "Sandwich shop", "Salad bar", "Ice cream shop",
    "Mexican restaurant", "Italian restaurant", "Chinese takeout",
]

TRANSPORT_DESCRIPTIONS = [
    "Gas station", "Uber ride", "Bus pass", "Parking fee",
    "Train ticket", "Taxi fare", "Car wash", "Toll payment",
    "Bike share", "Metro card top-up",
]

HOUSING_DESCRIPTIONS = [
    "Monthly rent", "Electricity bill", "Water bill", "Internet bill",
    "Home insurance", "Property tax", "Maintenance fee", "Trash collection",
    "Gas bill", "Home repair",
]

SHOPPING_DESCRIPTIONS = [
    "Clothing store", "Electronics", "Home decor", "Online shopping",
    "Department store", "Bookstore", "Hardware store", "Pharmacy",
    "Office supplies", "Gift purchase",
]

HEALTH_DESCRIPTIONS = [
    "Doctor visit", "Pharmacy", "Dental checkup", "Gym membership",
    "Eye exam", "Vitamins", "Health insurance", "Therapy session",
    "Medical test", "Prescription medication",
]

ENTERTAINMENT_DESCRIPTIONS = [
    "Movie tickets", "Streaming subscription", "Concert tickets", "Video game",
    "Museum entry", "Bowling", "Mini golf", "Arcade",
    "Live show", "Sports event ticket",
]


def _weighted_date(month: int, year: int) -> date:
    """Return a random day in the given month, weighted slightly toward weekdays."""
    last_day = 28
    if month == 2:
        last_day = 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28
    elif month in (4, 6, 9, 11):
        last_day = 30
    else:
        last_day = 31

    for _ in range(20):
        day = random.randint(1, last_day)
        d = date(year, month, day)
        if d.weekday() < 5:
            return d
    return date(year, month, random.randint(1, last_day))


def _generate_expenses_for_category(
    category_name: str,
    category_id: int,
    user_id: int,
    months_data: list[tuple[int, int]],
) -> list[Expense]:
    """Generate realistic expense entries for a single category across given months."""
    expenses: list[Expense] = []
    config = CATEGORY_LIMITS[category_name]
    descriptions_map = {
        "Food": FOOD_DESCRIPTIONS,
        "Transport": TRANSPORT_DESCRIPTIONS,
        "Housing": HOUSING_DESCRIPTIONS,
        "Shopping": SHOPPING_DESCRIPTIONS,
        "Health": HEALTH_DESCRIPTIONS,
        "Entertainment": ENTERTAINMENT_DESCRIPTIONS,
    }
    descriptions = descriptions_map[category_name]

    for month_idx, (month, year) in enumerate(months_data):
        if category_name == "Housing":
            entries_per_month = [1]
        elif category_name == "Food":
            entries_per_month = [12, 14, 16, 18, 20]
        elif category_name == "Transport":
            entries_per_month = [8, 10, 12]
        elif category_name == "Health":
            entries_per_month = [2, 3]
        elif category_name == "Shopping":
            entries_per_month = [4, 6, 8]
        else:
            entries_per_month = [4, 6, 8, 10]

        count = random.choice(entries_per_month)

        if month_idx == 0:
            count = max(1, count // 2)

        for _ in range(count):
            d = _weighted_date(month, year)

            if category_name == "Food":
                amount = round(random.uniform(8, 55), 2)
            elif category_name == "Transport":
                amount = round(random.uniform(12, 75), 2)
            elif category_name == "Housing":
                amount = round(random.uniform(1200, 1500), 2)
            elif category_name == "Shopping":
                amount = round(random.uniform(20, 180), 2)
            elif category_name == "Health":
                amount = round(random.uniform(15, 110), 2)
            else:
                amount = round(random.uniform(10, 70), 2)

            payment = random.choice(config["payment_methods"])
            description = random.choice(descriptions)

            expenses.append(
                Expense(
                    user_id=user_id,
                    category_id=category_id,
                    amount=amount,
                    description=description,
                    date=d,
                    payment_method=payment,
                )
            )

    return expenses


def main() -> None:
    init_local_sqlite()
    db = SessionLocal()

    try:
        db.execute(text("PRAGMA foreign_keys = OFF;"))

        db.query(AuthSession).delete()
        db.query(Expense).delete()
        db.query(Budget).delete()
        db.query(Category).delete()
        db.query(User).delete()
        db.flush()

        db.execute(text("PRAGMA foreign_keys = ON;"))

        demo_user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            name=DEMO_NAME,
        )
        db.add(demo_user)
        db.flush()

        category_map: dict[str, int] = {}
        for cat in DEFAULT_CATEGORIES:
            c = Category(user_id=demo_user.id, **cat)
            db.add(c)
            db.flush()
            category_map[cat["name"]] = c.id

        today = date.today()
        months_data: list[tuple[int, int]] = []
        for i in range(11, -1, -1):
            m = today.month - i
            y = today.year
            while m < 1:
                m += 12
                y -= 1
            while m > 12:
                m -= 12
                y += 1
            months_data.append((m, y))

        all_expenses: list[Expense] = []
        for cat_name, cat_id in category_map.items():
            all_expenses.extend(
                _generate_expenses_for_category(cat_name, cat_id, demo_user.id, months_data)
            )

        for exp in all_expenses:
            db.add(exp)
        db.flush()

        spent_by_category_month: dict[tuple[int, str], float] = {}
        for exp in all_expenses:
            key = (exp.category_id, exp.date.strftime("%Y-%m"))
            spent_by_category_month[key] = spent_by_category_month.get(key, 0) + float(exp.amount)

        for cat_name, cat_id in category_map.items():
            limit = CATEGORY_LIMITS[cat_name]["monthly_limit"]
            for month_str in [f"{y:04d}-{m:02d}" for m, y in months_data]:
                key = (cat_id, month_str)
                spent = round(spent_by_category_month.get(key, 0), 2)
                budget = Budget(
                    user_id=demo_user.id,
                    category_id=cat_id,
                    monthly_limit=limit,
                    month=month_str,
                    spent_so_far=spent,
                )
                db.add(budget)

        db.commit()

        total_expenses = len(all_expenses)
        total_budgets = 12 * len(category_map)
        print(f"Seed complete:")
        print(f"  User:      {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"  Expenses:  {total_expenses}")
        print(f"  Budgets:   {total_budgets}")
        print(f"  Categories: {len(category_map)}")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
