"""
conftest.py
───────────
Shared fixtures for the WYA test suite.

How it works:
- Creates a real SQLite file (temp) that mimics production schema
- Patches get_db in every router + auth_utils to use that temp DB
- Wipes tables between each test so nothing bleeds across
- Provides `client`, `registered_user`, and `auth_headers` fixtures
"""

import os
import sqlite3
import tempfile
import pytest
from fastapi.testclient import TestClient

# ── Temp DB setup (session-scoped — created once, shared across all tests) ────

DB_FILE = tempfile.mktemp(suffix="_wya_test.db")


def _create_schema() -> None:
    conn = sqlite3.connect(DB_FILE)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            user_id         TEXT PRIMARY KEY,
            email           TEXT UNIQUE NOT NULL,
            full_name       TEXT,
            birthday        TEXT DEFAULT '',
            gender          TEXT DEFAULT 'Female',
            location        TEXT DEFAULT 'Global',
            hashed_password TEXT NOT NULL,
            created_at      TEXT
        );

        CREATE TABLE IF NOT EXISTS wardrobe_items (
            item_id    TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            name       TEXT,
            category   TEXT,
            color      TEXT DEFAULT '',
            fabric     TEXT DEFAULT '',
            image_url  TEXT,
            tags       TEXT DEFAULT '[]',
            embedding  BLOB,
            created_at TEXT,
            archived   INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS outfits (
            outfit_id    TEXT PRIMARY KEY,
            user_id      TEXT NOT NULL,
            name         TEXT,
            vibe         TEXT DEFAULT '',
            items        TEXT DEFAULT '[]',
            created_date TEXT,
            last_worn    TEXT
        );

        CREATE TABLE IF NOT EXISTS style_dna (
            user_id       TEXT PRIMARY KEY,
            styles        TEXT DEFAULT '[]',
            comfort_level INTEGER DEFAULT 5,
            summary       TEXT DEFAULT '',
            updated_at    TEXT
        );
    """)
    conn.commit()
    conn.close()


_create_schema()


def get_test_db():
    """Drop-in replacement for database.get_db() pointing at the temp DB."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


# ── Patch every module that imports get_db ────────────────────────────────────

@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    """
    Each router does `from database import get_db`, so the name `get_db`
    lives inside each router module. We must patch every one individually.
    """
    import routers.auth_router      as auth_r
    import routers.wardrobe_router  as wardrobe_r
    import routers.outfit_router    as outfit_r
    import routers.style_router     as style_r
    import routers.user_router      as user_r
    import routers.recommend_router as recommend_r
    import routers.health_router    as health_r
    import auth_utils               as au

    for mod in (auth_r, wardrobe_r, outfit_r, style_r, user_r, recommend_r, health_r, au):
        if hasattr(mod, "get_db"):
            monkeypatch.setattr(mod, "get_db", get_test_db)


# ── Wipe tables between every test ────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clean_db():
    yield
    conn = get_test_db()
    conn.execute("DELETE FROM wardrobe_items")
    conn.execute("DELETE FROM outfits")
    conn.execute("DELETE FROM style_dna")
    conn.execute("DELETE FROM users")
    conn.commit()
    conn.close()


# ── Core fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def client():
    from main import app
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    """Register a fresh user and return the full response JSON."""
    res = client.post("/api/auth/register", json={
        "email": "ria@wya.com",
        "password": "Test1234!",
        "full_name": "Ria S"
    })
    assert res.status_code == 200, f"Registration failed: {res.text}"
    return res.json()


@pytest.fixture
def auth_headers(registered_user):
    """Return Bearer token headers for an authenticated user."""
    return {"Authorization": f"Bearer {registered_user['access_token']}"}


@pytest.fixture
def second_user(client):
    """A second registered user — used to test cross-user access."""
    res = client.post("/api/auth/register", json={
        "email": "other@wya.com",
        "password": "Other1234!",
        "full_name": "Other User"
    })
    assert res.status_code == 200
    return res.json()


@pytest.fixture
def second_auth_headers(second_user):
    return {"Authorization": f"Bearer {second_user['access_token']}"}
