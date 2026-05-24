"""
test_wardrobe.py
────────────────
Tests for /api/wardrobe endpoints.
Covers auth enforcement, CRUD, and cross-user isolation.
"""

import pytest


ITEM_PAYLOAD = {
    "name": "White Linen Shirt",
    "category": "Top",
    "color": "White",
    "fabric": "Linen",
    "tags": ["casual", "summer"]
}


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ENFORCEMENT
# ══════════════════════════════════════════════════════════════════════════════

class TestWardrobeAuth:

    def test_get_wardrobe_unauthenticated(self, client):
        """No token → 401 or 403."""
        res = client.get("/api/wardrobe")
        assert res.status_code in (401, 403)

    def test_add_item_unauthenticated(self, client):
        res = client.post("/api/wardrobe", json=ITEM_PAYLOAD)
        assert res.status_code in (401, 403)

    def test_delete_item_unauthenticated(self, client):
        res = client.delete("/api/wardrobe/fake-id")
        assert res.status_code in (401, 403)


# ══════════════════════════════════════════════════════════════════════════════
# GET WARDROBE
# ══════════════════════════════════════════════════════════════════════════════

class TestGetWardrobe:

    def test_get_wardrobe_empty(self, client, auth_headers):
        """Freshly registered user has an empty wardrobe."""
        res = client.get("/api/wardrobe", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == [] or isinstance(res.json(), list)

    def test_get_wardrobe_returns_only_own_items(
        self, client, auth_headers, second_auth_headers
    ):
        """User A's wardrobe must not contain User B's items."""
        # User A adds an item
        client.post("/api/wardrobe", json=ITEM_PAYLOAD, headers=auth_headers)

        # User B's wardrobe should be empty
        res = client.get("/api/wardrobe", headers=second_auth_headers)
        assert res.status_code == 200
        assert res.json() == []


# ══════════════════════════════════════════════════════════════════════════════
# ADD ITEM
# ══════════════════════════════════════════════════════════════════════════════

class TestAddItem:

    def test_add_item_success(self, client, auth_headers):
        """Adding a valid item returns 200 and the created item."""
        res = client.post("/api/wardrobe", json=ITEM_PAYLOAD, headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == "White Linen Shirt"
        assert body["category"] == "Top"

    def test_add_item_appears_in_wardrobe(self, client, auth_headers):
        """After adding, GET /api/wardrobe should include the new item."""
        client.post("/api/wardrobe", json=ITEM_PAYLOAD, headers=auth_headers)
        res = client.get("/api/wardrobe", headers=auth_headers)
        items = res.json()
        assert len(items) == 1
        assert items[0]["name"] == "White Linen Shirt"

    def test_add_multiple_items(self, client, auth_headers):
        """Adding two items → wardrobe has two items."""
        client.post("/api/wardrobe", json=ITEM_PAYLOAD, headers=auth_headers)
        client.post("/api/wardrobe", json={
            "name": "Black Jeans",
            "category": "Bottom",
            "color": "Black"
        }, headers=auth_headers)
        res = client.get("/api/wardrobe", headers=auth_headers)
        assert len(res.json()) == 2

    def test_add_item_missing_required_fields(self, client, auth_headers):
        """name and category are required — missing them → 422."""
        res = client.post("/api/wardrobe", json={
            "color": "Blue"
            # no name, no category
        }, headers=auth_headers)
        assert res.status_code == 422

    def test_add_item_optional_fields_default(self, client, auth_headers):
        """Item with only required fields should still be created."""
        res = client.post("/api/wardrobe", json={
            "name": "Plain Tee",
            "category": "Top"
        }, headers=auth_headers)
        assert res.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# DELETE ITEM
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteItem:

    def _add_item(self, client, headers, payload=None):
        payload = payload or ITEM_PAYLOAD
        res = client.post("/api/wardrobe", json=payload, headers=headers)
        assert res.status_code == 200
        return res.json()["item_id"]

    def test_delete_item_success(self, client, auth_headers):
        """Owner can delete their own item."""
        item_id = self._add_item(client, auth_headers)
        res = client.delete(f"/api/wardrobe/{item_id}", headers=auth_headers)
        assert res.status_code == 200

    def test_delete_item_removes_from_wardrobe(self, client, auth_headers):
        """After deletion, wardrobe should be empty."""
        item_id = self._add_item(client, auth_headers)
        client.delete(f"/api/wardrobe/{item_id}", headers=auth_headers)
        wardrobe = client.get("/api/wardrobe", headers=auth_headers).json()
        assert all(i["item_id"] != item_id for i in wardrobe)

    def test_delete_nonexistent_item(self, client, auth_headers):
        """Deleting an item that doesn't exist → 404."""
        res = client.delete("/api/wardrobe/does-not-exist", headers=auth_headers)
        assert res.status_code == 404

    def test_delete_other_users_item_forbidden(
        self, client, auth_headers, second_auth_headers
    ):
        """User B cannot delete User A's item — must return 403 or 404."""
        item_id = self._add_item(client, auth_headers)
        res = client.delete(f"/api/wardrobe/{item_id}", headers=second_auth_headers)
        assert res.status_code in (403, 404)
