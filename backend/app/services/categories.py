from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.user import User

DEFAULT_CATEGORIES = [
    {"name": "Food", "color_hex": "#ef4444", "icon": "utensils"},
    {"name": "Transport", "color_hex": "#3b82f6", "icon": "car"},
    {"name": "Housing", "color_hex": "#14b8a6", "icon": "home"},
    {"name": "Shopping", "color_hex": "#a855f7", "icon": "shopping-bag"},
    {"name": "Health", "color_hex": "#22c55e", "icon": "heart-pulse"},
    {"name": "Entertainment", "color_hex": "#f59e0b", "icon": "ticket"},
]


def seed_default_categories(db: Session, user: User) -> None:
    for item in DEFAULT_CATEGORIES:
        db.add(Category(user_id=user.id, **item))
