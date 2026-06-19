# Smart Expense Tracker

Full-stack personal expense tracking application with budget management and interactive analytics dashboards. Track spending across customizable categories, set monthly budgets, and visualize trends with rich charts.

**Demo credentials:** `admin@example.com` / `admin123`

## Screenshots

| Login | Dashboard |
|-------|-----------|
| ![Login](screenshots/login.png) | ![Dashboard](screenshots/dashboard.png) |

| Analytics | Expenses |
|-----------|----------|
| ![Analytics](screenshots/analytics.png) | ![Expenses](screenshots/expenses.png) |

| Categories |
|------------|
| ![Categories](screenshots/categories.png) |

## Features

- **User Authentication** — Register, login, and session management with JWT access + refresh tokens and CSRF protection
- **Expense Management** — Full CRUD with filtering by date range, category, and amount; paginated list view
- **Custom Categories** — User-defined categories with color coding and icons; default categories auto-seeded on signup
- **Budget Tracking** — Monthly budgets per category with automatic spend recalculation on every expense change
- **Analytics Dashboard** — Current month summary with stats cards, category breakdown pie chart, monthly bar chart, and recent expenses
- **Analytics Page** — 12-month spending trend line chart, category distribution pie chart, category breakdown table, and budget usage progress bars
- **Responsive UI** — Mobile-friendly sidebar layout built with React and inline styles

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| **Frontend** | React 18, React Router v6, Vite, Recharts, Lucide React |
| **Database** | SQLite (development), PostgreSQL (production) |
| **Auth** | JWT (access + refresh tokens), bcrypt, HTTP-only cookies |
| **Testing** | pytest, httpx (ASGI test client) |

## Architecture

```
SmartExpenseTracker/
├── backend/          # FastAPI REST API
│   ├── app/
│   │   ├── core/     # Config, database, security, middleware, rate limiting
│   │   ├── models/   # SQLAlchemy ORM models (User, Category, Expense, Budget, AuthSession)
│   │   ├── routers/  # API endpoints (auth, categories, expenses, analytics)
│   │   ├── schemas/  # Pydantic request/response schemas
│   │   ├── services/ # Business logic (category seeding, budget recalculation)
│   │   └── scripts/  # CLI tools (migration, seed data)
│   ├── alembic/      # Database migrations
│   └── tests/        # pytest test suite
└── frontend/         # React SPA
    └── src/
        ├── components/  # Shared UI (Layout, ErrorBoundary)
        ├── contexts/    # Auth and Toast state management
        ├── pages/       # Route pages (Dashboard, Expenses, Categories, Analytics, Login, Register)
        ├── services/    # API client with auto-refresh and CSRF
        └── utils/       # Formatting helpers
```

The Vite dev server proxies `/api/*` requests to the FastAPI backend (`http://localhost:8000`), stripping the `/api` prefix.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cp .env.example .env
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`.

## Seed Data

Populate the database with a demo user, 6 categories, 12 months of budgets, and ~480 realistic expense entries:

```bash
cd backend
python -m app.scripts.seed_data
```

This performs a **destructive reset** — all existing data is deleted before seeding.

You can also run it via the installed console script:
```bash
smart-expense-seed
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |
| GET/POST | `/categories` | List / Create categories |
| GET/PUT/DELETE | `/categories/{id}` | Get / Update / Delete category |
| GET/POST | `/expenses` | List (with filters) / Create expense |
| GET/PUT/DELETE | `/expenses/{id}` | Get / Update / Delete expense |
| GET | `/analytics/monthly-summary` | 12-month spending totals |
| GET | `/analytics/category-breakdown` | Current month category breakdown |
| GET | `/analytics/dashboard-summary` | Dashboard stats + budget usage |
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness check (includes database) |

## Testing

```bash
cd backend
pip install -e ".[test]"
pytest
```

The test suite uses an in-memory SQLite database and covers auth flows, category CRUD, expense CRUD with category filtering, analytics endpoints, and production config validation.

## Database

Development uses SQLite by default (`backend/smart_expense_tracker.db`). Set `DATABASE_URL` to a PostgreSQL connection string in `backend/.env` for production.

```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/smart_expense_tracker
JWT_SECRET_KEY=<long-random-string>
```

Run Alembic migrations to set up the schema:

```bash
cd backend
alembic upgrade head
```

## Configuration

Key environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./smart_expense_tracker.db` | Database connection string |
| `JWT_SECRET_KEY` | `change-me-in-development` | Secret key for JWT signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Refresh token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |
| `APP_CURRENCY` | `USD` | Default currency for formatting |
| `APP_TIMEZONE` | `UTC` | Application timezone |
