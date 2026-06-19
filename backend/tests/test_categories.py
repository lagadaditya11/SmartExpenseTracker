from fastapi.testclient import TestClient

from tests.conftest import csrf_headers


def test_category_crud(authenticated_client: TestClient) -> None:
    headers = csrf_headers(authenticated_client)
    created = authenticated_client.post(
        "/categories",
        json={"name": "Books", "color_hex": "#0f766e", "icon": "book"},
        headers=headers,
    )
    assert created.status_code == 201

    updated = authenticated_client.patch(
        f"/categories/{created.json()['id']}", json={"name": "Reading"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Reading"

    deleted = authenticated_client.delete(f"/categories/{created.json()['id']}", headers=headers)
    assert deleted.status_code == 204
    assert authenticated_client.patch(
        f"/categories/{created.json()['id']}", json={"name": "Missing"}, headers=headers
    ).status_code == 404


def test_category_ownership(client: TestClient) -> None:
    owner = {"email": "owner@example.com", "password": "password123", "name": "Owner"}
    other = {"email": "other@example.com", "password": "password123", "name": "Other"}
    assert client.post("/auth/register", json=owner).status_code == 201
    created = client.post(
        "/categories",
        json={"name": "Private", "color_hex": "#111827", "icon": "lock"},
        headers=csrf_headers(client),
    )
    assert created.status_code == 201

    assert client.post("/auth/register", json=other).status_code == 201
    stolen = client.patch(
        f"/categories/{created.json()['id']}",
        json={"name": "Stolen"},
        headers=csrf_headers(client),
    )
    assert stolen.status_code == 404
