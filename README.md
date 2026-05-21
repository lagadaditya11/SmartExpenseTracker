# Smart Expense Tracker

Simple FastAPI backend for tracking expenses, categories, auth, and dashboard analytics.

## Run

Run the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

API docs are available at `http://127.0.0.1:8000/docs`.

## Backend

- Auth with JWT
- Default categories on signup
- Expense CRUD with filters
- Basic dashboard analytics
- Alembic migrations

## Production Database

The default database is local SQLite at `backend/smart_expense_tracker.db`.
Set `DATABASE_URL` to PostgreSQL in `backend/.env` only when you are ready to move off SQLite.
