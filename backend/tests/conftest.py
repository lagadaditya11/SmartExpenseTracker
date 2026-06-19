from collections.abc import Generator

import pytest
import anyio
import httpx
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.rate_limit import auth_rate_limiter
from app.main import app


class TestClient:
    """Small synchronous wrapper around HTTPX's ASGI transport.

    Starlette's blocking portal is incompatible with the newest AnyIO in the
    execution environment, while the production ASGI path remains unaffected.
    """

    def __init__(self) -> None:
        self.cookies = httpx.Cookies()

    def request(self, method: str, path: str, **kwargs) -> httpx.Response:
        async def send() -> httpx.Response:
            transport = httpx.ASGITransport(app=app, raise_app_exceptions=True)
            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://testserver",
                cookies=self.cookies,
            ) as client:
                return await client.request(method, path, **kwargs)

        response = anyio.run(send)
        self.cookies.update(response.cookies)
        return response

    def get(self, path: str, **kwargs) -> httpx.Response:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs) -> httpx.Response:
        return self.request("POST", path, **kwargs)

    def patch(self, path: str, **kwargs) -> httpx.Response:
        return self.request("PATCH", path, **kwargs)

    def delete(self, path: str, **kwargs) -> httpx.Response:
        return self.request("DELETE", path, **kwargs)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):  # noqa: ANN001, ARG001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield testing_session
    finally:
        testing_session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    auth_rate_limiter.reset()
    yield TestClient()
    app.dependency_overrides.clear()


def csrf_headers(client: TestClient) -> dict[str, str]:
    token = client.cookies.get("csrf_token")
    return {"X-CSRF-Token": token} if token else {}


@pytest.fixture()
def authenticated_client(client: TestClient) -> TestClient:
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123", "name": "User"},
    )
    assert response.status_code == 201, response.text
    return client
