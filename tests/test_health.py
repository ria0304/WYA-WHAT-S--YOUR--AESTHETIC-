"""
test_health.py
──────────────
Tests for GET /health, /health/ready, /health/info
"""

import pytest


class TestLiveness:

    def test_liveness_returns_200(self, client):
        res = client.get("/health")
        assert res.status_code == 200

    def test_liveness_returns_ok(self, client):
        res = client.get("/health")
        assert res.json()["status"] == "ok"


class TestReadiness:

    def test_readiness_returns_200_or_503(self, client):
        """Returns 200 when DB is reachable, 503 when not."""
        res = client.get("/health/ready")
        assert res.status_code in (200, 503)

    def test_readiness_has_database_check(self, client):
        """Response must include a database field in checks."""
        res = client.get("/health/ready")
        body = res.json()
        assert "checks" in body
        assert "database" in body["checks"]

    def test_readiness_has_uptime(self, client):
        """Response must include uptime_seconds."""
        res = client.get("/health/ready")
        assert "uptime_seconds" in res.json()

    def test_readiness_db_ok_with_test_db(self, client):
        """With our patched test DB in place, readiness should return 200."""
        res = client.get("/health/ready")
        assert res.status_code == 200
        assert res.json()["checks"]["database"] == "ok"


class TestInfo:

    def test_info_returns_200(self, client):
        res = client.get("/health/info")
        assert res.status_code == 200

    def test_info_has_app_name(self, client):
        res = client.get("/health/info")
        assert "WYA" in res.json()["app"]

    def test_info_has_version(self, client):
        res = client.get("/health/info")
        assert "version" in res.json()

    def test_info_has_uptime(self, client):
        res = client.get("/health/info")
        assert "uptime_seconds" in res.json()
        assert res.json()["uptime_seconds"] >= 0

    def test_info_has_environment(self, client):
        res = client.get("/health/info")
        assert "environment" in res.json()
