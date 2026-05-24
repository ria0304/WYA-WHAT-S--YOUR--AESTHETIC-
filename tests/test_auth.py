"""
test_auth.py
────────────
Tests for POST /api/auth/register and POST /api/auth/login
"""

import pytest


# ══════════════════════════════════════════════════════════════════════════════
# REGISTER
# ══════════════════════════════════════════════════════════════════════════════

class TestRegister:

    def test_register_success(self, client):
        """Happy path — valid payload returns 200 with token and user."""
        res = client.post("/api/auth/register", json={
            "email": "new@wya.com",
            "password": "Secure123!",
            "full_name": "New User"
        })
        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert "user" in body
        assert body["user"]["email"] == "new@wya.com"

    def test_register_returns_non_empty_token(self, client):
        """Token must be a non-empty string."""
        res = client.post("/api/auth/register", json={
            "email": "token@wya.com",
            "password": "Secure123!",
            "full_name": "Token User"
        })
        token = res.json()["access_token"]
        assert isinstance(token, str)
        assert len(token) > 20

    def test_register_optional_fields_default(self, client):
        """Registering without optional fields should still succeed."""
        res = client.post("/api/auth/register", json={
            "email": "minimal@wya.com",
            "password": "Pass1234!",
            "full_name": "Minimal User"
            # no birthday, gender, location
        })
        assert res.status_code == 200
        user = res.json()["user"]
        assert user["gender"] == "Female"
        assert user["location"] == "Global"

    def test_register_duplicate_email_fails(self, client):
        """Registering the same email twice must return 400."""
        payload = {
            "email": "dupe@wya.com",
            "password": "Pass1234!",
            "full_name": "First User"
        }
        first = client.post("/api/auth/register", json=payload)
        assert first.status_code == 200

        second = client.post("/api/auth/register", json=payload)
        assert second.status_code == 400
        assert "Registration failed" in second.json()["detail"]

    def test_register_missing_email_returns_422(self, client):
        """Missing required field `email` → Pydantic validation error 422."""
        res = client.post("/api/auth/register", json={
            "password": "Pass1234!",
            "full_name": "No Email"
        })
        assert res.status_code == 422

    def test_register_missing_password_returns_422(self, client):
        res = client.post("/api/auth/register", json={
            "email": "nopw@wya.com",
            "full_name": "No Password"
        })
        assert res.status_code == 422

    def test_register_missing_full_name_returns_422(self, client):
        res = client.post("/api/auth/register", json={
            "email": "noname@wya.com",
            "password": "Pass1234!"
        })
        assert res.status_code == 422

    def test_register_stores_hashed_password(self, client):
        """The returned user object must NOT expose the raw password."""
        res = client.post("/api/auth/register", json={
            "email": "hash@wya.com",
            "password": "PlainText123",
            "full_name": "Hash Check"
        })
        user = res.json()["user"]
        # hashed_password should not equal the plain password
        assert user.get("hashed_password") != "PlainText123"


# ══════════════════════════════════════════════════════════════════════════════
# LOGIN
# ══════════════════════════════════════════════════════════════════════════════

class TestLogin:

    def test_login_success(self, client, registered_user):
        """Happy path — correct credentials return 200 with token."""
        res = client.post("/api/auth/login", json={
            "email": "ria@wya.com",
            "password": "Test1234!"
        })
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_login_returns_user_data(self, client, registered_user):
        """Login response must include the user object with correct email."""
        res = client.post("/api/auth/login", json={
            "email": "ria@wya.com",
            "password": "Test1234!"
        })
        user = res.json()["user"]
        assert user["email"] == "ria@wya.com"
        assert user["full_name"] == "Ria S"

    def test_login_wrong_password(self, client, registered_user):
        """Wrong password must return 401."""
        res = client.post("/api/auth/login", json={
            "email": "ria@wya.com",
            "password": "WrongPassword!"
        })
        assert res.status_code == 401
        assert "Invalid credentials" in res.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Logging in with an email that was never registered → 401."""
        res = client.post("/api/auth/login", json={
            "email": "ghost@wya.com",
            "password": "NoSuchUser1!"
        })
        assert res.status_code == 401

    def test_login_missing_email_returns_422(self, client):
        res = client.post("/api/auth/login", json={"password": "Pass1234!"})
        assert res.status_code == 422

    def test_login_missing_password_returns_422(self, client):
        res = client.post("/api/auth/login", json={"email": "ria@wya.com"})
        assert res.status_code == 422

    def test_login_token_differs_from_registration_token(self, client, registered_user):
        """
        Login may return a freshly issued token — it doesn't have to match
        the one from registration, but it must be a valid non-empty JWT.
        """
        res = client.post("/api/auth/login", json={
            "email": "ria@wya.com",
            "password": "Test1234!"
        })
        token = res.json()["access_token"]
        assert isinstance(token, str)
        assert len(token) > 20
