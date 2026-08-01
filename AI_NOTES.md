# AI Use and Development Notes

## Purpose

AI tools (ChatGPT/Codex) were used as a development assistant for this project. They helped generate initial implementation ideas and boilerplate; the final application was reviewed, integrated, and validated by the developer.


## Contribution split

### AI-assisted / generated work

AI was used to accelerate first drafts and implementation patterns for:

- FastAPI route, schema, and SQLAlchemy model boilerplate for authentication, categories, expenses, and analytics.
- React page/component structure for the dashboard, expenses, categories, analytics, login, and registration views.
- Reusable API-client patterns, including attaching authentication details and retrying a request after token refresh.
- Initial chart layouts and data-display ideas using Recharts.
- Test-case ideas for normal CRUD behaviour, ownership boundaries, invalid input, and authentication flows.
- Documentation wording and this AI usage record.

### Developer-written / developer-controlled work

The developer made and retained control over the application-specific parts of the project:

- Selected the product scope: a personal expense tracker with categories, monthly budgets, dashboards, and analytics.
- Chose the stack and project organisation: React/Vite frontend, FastAPI/SQLAlchemy backend, Alembic migrations, and SQLite for local development.
- Defined the data relationships and user-facing workflow: users own their categories, expenses, budgets, and sessions.
- Connected the frontend screens to the API and refined the UI flow, filtering, formatting, empty states, and feedback messages.
- Reviewed generated code, resolved integration issues, and decided which security and validation measures were appropriate for the project.
- Ran the project locally and checked the actual screens shown in `screenshots/`.

## What was checked or changed after AI output

AI output was treated as a starting point, not as trusted final code. The following checks and changes were made during integration:

| Area | Validation or change | Reason |
| --- | --- | --- |
| Authentication | Added/reviewed access and refresh token handling, HTTP-only cookie use, CSRF protection for authenticated mutations, password hashing, and session handling. | Authentication code needs deliberate security review; a generated happy-path login alone is insufficient. |
| Data isolation | Tests cover attempts to access another user's category and reject cross-tenant category use in expenses. | Every record must be scoped to the signed-in user. |
| Input and error handling | Request schemas and API error responses were reviewed for invalid login, duplicate registration, invalid category data, and invalid expense/category combinations. | The UI and API should fail safely rather than accept inconsistent data. |
| Budgets and analytics | Expense create/update/delete flows recalculate budget spending; analytics queries aggregate the current and historical data used by the charts. | Derived totals can become inaccurate unless they are updated with each data change. |
| Production configuration | Added/reviewed environment-based configuration, CORS configuration, health endpoints, logging, rate limiting, and checks against unsafe production defaults. | Local-development defaults should not silently become production settings. |
| Database evolution | Used Alembic migrations rather than relying only on ad-hoc table creation. | The schema needs a repeatable upgrade path. |
| Frontend usability | Checked responsive layout, loading/error states, toast feedback, date/currency formatting, and page navigation. | Generated UI code was adjusted to make normal user actions understandable. |

## Testing performed

The backend test suite uses an in-memory SQLite database. It covers:

- registration, login, token refresh, logout, duplicate/invalid login, and CSRF requirements;
- category CRUD and category ownership;
- expense CRUD, filtering, category validation, cross-user protection, and analytics endpoints;
- rejection of unsafe production configuration.

Recommended verification commands:

```bash
cd backend
pip install -e ".[test]"
pytest

cd ../frontend
npm install
npm run build
```

Manual checks were also made by running the backend and Vite frontend, then checking registration/login, category creation, adding/editing/deleting expenses, budget progress, filtering, dashboard totals, and analytics charts.

## AI suggestions not used

- **Storing authentication tokens in `localStorage`: not used.** The project uses a safer cookie/session-oriented approach with refresh handling and CSRF protection, reducing exposure to token theft through injected browser scripts.
- **Leaving analytics calculations entirely in the browser: not used.** Aggregation is exposed through backend analytics endpoints so calculations use the authenticated user’s data consistently and the frontend remains focused on presentation.
- **Using only a single static category list: not used.** Users can create and manage their own categories, while sensible defaults are seeded at registration.
- **Skipping migrations for a small project: not used.** Alembic migrations were retained so the database schema can be recreated and upgraded reliably.

## Build process followed

1. Defined the MVP: secure user accounts, categories, expenses, monthly budgets, dashboard, and analytics.
2. Created the FastAPI application structure, configuration, database connection, models, Pydantic schemas, and Alembic migrations.
3. Implemented authentication with password hashing, JWT access/refresh flow, sessions, CSRF checks, and user-scoped dependencies.
4. Implemented category and expense CRUD, ensuring a user can only access their own records.
5. Added budget recalculation and analytics endpoints for monthly summaries, category breakdowns, and dashboard statistics.
6. Built the React/Vite application: shared layout, routing, authentication/toast contexts, API client, and feature pages.
7. Added charts, filters, forms, validation feedback, responsive styling, and formatting utilities.
8. Wrote and ran backend tests, then manually exercised the main user journeys in the browser.
9. Added seed-data and migration utilities, documentation, screenshots, and this AI-use record for reproducibility.

## Lessons learned

The most useful role for AI was speeding up repetitive scaffolding and suggesting test cases. The most important developer work was reviewing security-sensitive code, enforcing per-user ownership, connecting the pieces into a coherent product, and testing the application against real user flows.
