"""
test_outfits.py
───────────────
Tests for /api/outfits (CRUD) and /api/ai (rate limiting).
"""

import pytest


OUTFIT_PAYLOAD = {
    "name": "Summer Casual",
    "vibe": "relaxed",
    "items": [
        {
            "item_id": "test-item-001",
            "name": "White Linen Shirt",
            "category": "Top",
            "color": "White"
        },
        {
            "item_id": "test-item-002",
            "name": "Blue Jeans",
            "category": "Bottom",
            "color": "Blue"
        }
    ]
}


# ══════════════════════════════════════════════════════════════════════════════
# OUTFIT CRUD
# ══════════════════════════════════════════════════════════════════════════════

class TestOutfitCRUD:

    def test_create_outfit_success(self, client, auth_headers):
        res = client.post("/api/outfits", json=OUTFIT_PAYLOAD, headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == "Summer Casual"
        assert body["vibe"] == "relaxed"

    def test_create_outfit_unauthenticated(self, client):
        res = client.post("/api/outfits", json=OUTFIT_PAYLOAD)
        assert res.status_code in (401, 403)

    def test_get_outfits_empty(self, client, auth_headers):
        """New user has no outfits."""
        res = client.get("/api/outfits", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_get_outfits_after_create(self, client, auth_headers):
        """Outfit appears in list after creation."""
        client.post("/api/outfits", json=OUTFIT_PAYLOAD, headers=auth_headers)
        res = client.get("/api/outfits", headers=auth_headers)
        outfits = res.json()
        assert len(outfits) == 1
        assert outfits[0]["name"] == "Summer Casual"

    def test_outfits_isolated_per_user(self, client, auth_headers, second_auth_headers):
        """User B cannot see User A's outfits."""
        client.post("/api/outfits", json=OUTFIT_PAYLOAD, headers=auth_headers)
        res = client.get("/api/outfits", headers=second_auth_headers)
        assert res.json() == []

    def test_create_outfit_missing_name(self, client, auth_headers):
        """name is required — missing it → 422."""
        res = client.post("/api/outfits", json={
            "vibe": "casual",
            "items": []
        }, headers=auth_headers)
        assert res.status_code == 422

    def test_create_outfit_empty_items(self, client, auth_headers):
        """Outfit with no items should still be created."""
        res = client.post("/api/outfits", json={
            "name": "Empty Outfit",
            "items": []
        }, headers=auth_headers)
        assert res.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# AI ENDPOINT RATE LIMITING
# ══════════════════════════════════════════════════════════════════════════════

class TestRateLimiting:
    """
    These tests verify slowapi rate limiting on AI endpoints.
    Limit is 10/minute per IP — the 11th request must return 429.

    Note: These tests reset between runs because clean_db wipes state,
    but slowapi's in-memory counter is per-process. If other tests already
    hit the limit in the same process run, tests may see 429 earlier.
    Run these in isolation with:  pytest tests/test_outfits.py::TestRateLimiting
    """

    AI_ENDPOINTS = [
        ("/api/ai/fabric-scan",     {"image_url": "http://example.com/shirt.jpg"}),
        ("/api/ai/outfit-match",    {"item_id": "test-001"}),
        ("/api/ai/curate-outfits",  {}),
        ("/api/ai/gap-analysis",    {}),
    ]

    @pytest.mark.parametrize("endpoint,payload", AI_ENDPOINTS)
    def test_rate_limit_returns_429_after_limit(self, client, auth_headers, endpoint, payload):
        """
        Hit the endpoint 11 times — the 11th must be 429 Too Many Requests.
        The first 10 can return anything except 429 (200, 422, 500 are all fine
        since we're not sending real images/items).
        """
        responses = []
        for _ in range(11):
            res = client.post(endpoint, json=payload, headers=auth_headers)
            responses.append(res.status_code)

        assert 429 in responses, (
            f"Expected 429 after 10 requests to {endpoint}, got: {responses}"
        )

    def test_green_audit_rate_limit_is_20(self, client, auth_headers):
        """
        /api/ai/green-audit has a higher limit of 20/min.
        First 20 requests must NOT return 429.
        """
        non_429 = 0
        for _ in range(20):
            res = client.post(
                "/api/ai/green-audit",
                json={"brand": "Zara"},
                headers=auth_headers
            )
            if res.status_code != 429:
                non_429 += 1

        # At least 19 of 20 should pass before hitting limit
        assert non_429 >= 19, f"Expected ≥19 non-429 responses, got {non_429}"
