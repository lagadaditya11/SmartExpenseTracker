from datetime import date

from fastapi.testclient import TestClient

from tests.conftest import csrf_headers


def test_expense_crud_filters_and_analytics(authenticated_client: TestClient) -> None:
    categories = authenticated_client.get("/categories").json()
    food = next(category for category in categories if category["name"] == "Food")
    transport = next(category for category in categories if category["name"] == "Transport")
    headers = csrf_headers(authenticated_client)

    first = authenticated_client.post(
        "/expenses",
        json={
            "amount": "25.50",
            "description": "Lunch",
            "date": date.today().isoformat(),
            "payment_method": "card",
            "category_id": food["id"],
        },
        headers=headers,
    )
    assert first.status_code == 201, first.text
    second = authenticated_client.post(
        "/expenses",
        json={
            "amount": "10.00",
            "description": "Metro",
            "date": date.today().isoformat(),
            "payment_method": "upi",
            "category_id": transport["id"],
        },
        headers=headers,
    )
    assert second.status_code == 201

    filtered = authenticated_client.get("/expenses", params={"category_id": food["id"]}).json()
    assert filtered["total"] == 1
    assert filtered["items"][0]["description"] == "Lunch"

    updated = authenticated_client.patch(
        f"/expenses/{first.json()['id']}", json={"amount": "30.00"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["amount"] == "30.00"

    dashboard = authenticated_client.get("/analytics/dashboard-summary").json()
    assert dashboard["current_month_total"] == "40.00"
    assert dashboard["transaction_count"] == 2
    assert len(dashboard["category_breakdown"]) == 2

    assert authenticated_client.delete(
        f"/expenses/{first.json()['id']}", headers=headers
    ).status_code == 204
    assert authenticated_client.get("/expenses").json()["total"] == 1


def test_invalid_and_cross_tenant_category_rejected(client: TestClient) -> None:
    owner = {"email": "owner@example.com", "password": "password123", "name": "Owner"}
    other = {"email": "other@example.com", "password": "password123", "name": "Other"}
    assert client.post("/auth/register", json=owner).status_code == 201
    private = client.post(
        "/categories",
        json={"name": "Private", "color_hex": "#111827", "icon": "lock"},
        headers=csrf_headers(client),
    ).json()
    assert client.post("/auth/register", json=other).status_code == 201

    for category_id in (private["id"], 9999):
        rejected = client.post(
            "/expenses",
            json={
                "amount": "12.00",
                "description": "Bad category",
                "date": date.today().isoformat(),
                "payment_method": "cash",
                "category_id": category_id,
            },
            headers=csrf_headers(client),
        )
        assert rejected.status_code == 400
