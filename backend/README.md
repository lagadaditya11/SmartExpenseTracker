# Smart Expense Tracker Backend

FastAPI backend for the Phase 1 MVP: auth, categories, expenses, and basic analytics.

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cp .env.example .env
uvicorn app.main:app --reload
```

## Tests

```bash
pytest
```
