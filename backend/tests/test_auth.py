from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.security import decode_access_token
from tests.conftest import csrf_headers


def test_register_refresh_logout_and_login(client: TestClient) -> None:
    registered = client.post(
        "/auth/register",
        json={"email": "Person@Example.com", "password": "password123", "name": "Person"},
    )
    assert registered.status_code == 201
    assert registered.json()["email"] == "person@example.com"
    assert decode_access_token(client.cookies["access_token"]) == registered.json()["id"]
    assert "HttpOnly" in registered.headers.get_list("set-cookie")[0]

    assert client.get("/auth/me").status_code == 200
    refresh = client.post("/auth/refresh", headers=csrf_headers(client))
    assert refresh.status_code == 200

    logout = client.post("/auth/logout", headers=csrf_headers(client))
    assert logout.status_code == 204
    assert client.get("/auth/me").status_code == 401

    login = client.post(
        "/auth/login",
        json={"email": "person@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert login.json()["name"] == "Person"


def test_duplicate_invalid_login_and_default_categories(client: TestClient) -> None:
    payload = {"email": "person@example.com", "password": "password123", "name": "Person"}
    assert client.post("/auth/register", json=payload).status_code == 201
    duplicate = client.post("/auth/register", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "http_409"
    assert duplicate.json()["request_id"]

    bad_login = client.post(
        "/auth/login", json={"email": "person@example.com", "password": "not-correct"}
    )
    assert bad_login.status_code == 401
    assert len(client.get("/categories").json()) == 6


def test_csrf_is_required_for_authenticated_mutations(authenticated_client: TestClient) -> None:
    rejected = authenticated_client.post(
        "/categories",
        json={"name": "Books", "color_hex": "#123456", "icon": "book"},
    )
    assert rejected.status_code == 403
    assert rejected.json()["code"] == "csrf_validation_failed"


def test_production_configuration_rejects_unsafe_defaults() -> None:
    try:
        Settings(app_env="production", _env_file=None)
    except ValueError as exc:
        assert "PostgreSQL" in str(exc)
    else:
        raise AssertionError("Unsafe production configuration was accepted")
