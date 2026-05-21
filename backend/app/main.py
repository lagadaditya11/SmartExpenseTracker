from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_local_sqlite
from app.routers import analytics, auth, categories, expenses

app = FastAPI(title="Smart Expense Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(analytics.router)


@app.on_event("startup")
def startup() -> None:
    init_local_sqlite()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
