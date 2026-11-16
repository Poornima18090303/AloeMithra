"""
Unit tests for Phase 2: SQLite database, bcrypt authentication, and history persistence.
"""

import tempfile
from pathlib import Path
import pytest
from PIL import Image
import io

from core.db import (
    init_db,
    create_user,
    get_user_by_username,
    get_user_by_id,
    update_user_language,
    add_history_record,
    get_user_history,
    delete_history_record,
    clear_user_history
)
from core.auth import hash_password, verify_password


@pytest.fixture
def temp_db():
    """Create a temporary SQLite database for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_aloemithra.db"
        init_db(db_path)
        yield db_path


def test_password_hashing():
    """Verify bcrypt hashes passwords properly and verifies correctly."""
    plain = "SuperSecret123!"
    hashed = hash_password(plain)
    
    # Must be hashed, never plain text
    assert hashed != plain
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    
    # Verification
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_user_creation_and_retrieval(temp_db):
    """Test creating user accounts and retrieving by username and ID."""
    hashed = hash_password("pass123")
    user_id = create_user("farmer_john", hashed, language="kn", db_path=temp_db)
    assert user_id is not None
    assert user_id > 0

    # Retrieve by username
    user = get_user_by_username("farmer_john", db_path=temp_db)
    assert user is not None
    assert user["username"] == "farmer_john"
    assert user["language"] == "kn"

    # Case insensitive lookup
    user_upper = get_user_by_username("FARMER_JOHN", db_path=temp_db)
    assert user_upper is not None
    assert user_upper["id"] == user_id

    # Retrieve by ID
    user_by_id = get_user_by_id(user_id, db_path=temp_db)
    assert user_by_id["username"] == "farmer_john"

    # Rejection of duplicate username
    dup_id = create_user("farmer_john", hash_password("pass456"), db_path=temp_db)
    assert dup_id is None


def test_user_language_update(temp_db):
    """Test updating user preferred language."""
    user_id = create_user("mary", hash_password("pass123"), language="en", db_path=temp_db)
    assert update_user_language(user_id, "hi", db_path=temp_db) is True
    user = get_user_by_id(user_id, db_path=temp_db)
    assert user["language"] == "hi"


def test_history_with_photo_consent(temp_db):
    """When user ticks consent box, photo thumbnail is saved in history."""
    user_id = create_user("consent_user", hash_password("pass123"), db_path=temp_db)

    # Dummy thumbnail bytes
    img = Image.new("RGB", (50, 50), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    fake_thumb = buf.getvalue()

    rec_id = add_history_record(
        user_id=user_id,
        condition="Aloe Rust",
        confidence=0.88,
        second_label="Leaf Spot",
        second_confidence=0.08,
        status="confident",
        language="en",
        thumbnail_bytes=fake_thumb,
        consent_photo_saved=True,
        db_path=temp_db
    )
    assert rec_id > 0

    history = get_user_history(user_id, db_path=temp_db)
    assert len(history) == 1
    rec = history[0]
    assert rec["condition"] == "Aloe Rust"
    assert rec["confidence"] == 0.88
    assert rec["consent_photo_saved"] == 1
    assert rec["thumbnail"] == fake_thumb


def test_history_without_photo_consent(temp_db):
    """When user unchecks consent box, only diagnosis is saved and thumbnail is None."""
    user_id = create_user("privacy_user", hash_password("pass123"), db_path=temp_db)

    rec_id = add_history_record(
        user_id=user_id,
        condition="Sunburn",
        confidence=0.91,
        second_label="Healthy",
        second_confidence=0.05,
        status="confident",
        language="hi",
        thumbnail_bytes=b"raw_bytes_should_not_save",
        consent_photo_saved=False,
        db_path=temp_db
    )
    assert rec_id > 0

    history = get_user_history(user_id, db_path=temp_db)
    assert len(history) == 1
    rec = history[0]
    assert rec["condition"] == "Sunburn"
    assert rec["consent_photo_saved"] == 0
    assert rec["thumbnail"] is None


def test_history_deletion(temp_db):
    """Test deleting one record and clearing all records for a user."""
    user_id = create_user("delete_test", hash_password("pass123"), db_path=temp_db)
    rec1 = add_history_record(user_id, "Anthracnose", 0.75, "Leaf Spot", 0.15, "possible", "en", db_path=temp_db)
    rec2 = add_history_record(user_id, "Healthy", 0.95, "Aloe Rust", 0.02, "confident", "en", db_path=temp_db)

    assert len(get_user_history(user_id, db_path=temp_db)) == 2

    # Delete single record
    assert delete_history_record(rec1, user_id, db_path=temp_db) is True
    remaining = get_user_history(user_id, db_path=temp_db)
    assert len(remaining) == 1
    assert remaining[0]["id"] == rec2

    # Clear all
    assert clear_user_history(user_id, db_path=temp_db) is True
    assert len(get_user_history(user_id, db_path=temp_db)) == 0
