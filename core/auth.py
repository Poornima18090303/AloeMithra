"""
Authentication module for AloeMithra.
Uses bcrypt for secure password hashing and handles session authentication.
"""

from typing import Optional, Tuple, Dict, Any
import bcrypt

try:
    import streamlit as st
except ImportError:
    st = None

from core.db import (
    init_db,
    create_user,
    get_user_by_username,
    get_user_by_id,
    update_user_language,
)
from core.i18n import set_current_language

# Ensure tables are ready on module import
init_db()


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt with salt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def sign_up(username: str, password: str, language: str = "en") -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """Register a new user account with hashed password."""
    username = username.strip()
    if not username:
        return False, "Username cannot be empty.", None

    if len(username) < 3:
        return False, "Username must be at least 3 characters.", None

    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters.", None

    hashed_pw = hash_password(password)
    user_id = create_user(username=username, password_hash=hashed_pw, language=language)

    if user_id is None:
        return False, "Username is already taken. Please choose another.", None

    user = get_user_by_id(user_id)
    if st is not None and hasattr(st, "session_state"):
        st.session_state["user"] = user
        set_current_language(language)

    return True, "Account created successfully!", user


def sign_in(username: str, password: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """Authenticate user with username and password."""
    username = username.strip()
    if not username or not password:
        return False, "Please enter both username and password.", None

    user = get_user_by_username(username)
    if not user:
        return False, "Invalid username or password.", None

    if not verify_password(password, user["password_hash"]):
        return False, "Invalid username or password.", None

    if st is not None and hasattr(st, "session_state"):
        st.session_state["user"] = user
        set_current_language(user.get("language", "en"))

    return True, "Signed in successfully!", user


def sign_out() -> None:
    """Log out current user from session."""
    if st is not None and hasattr(st, "session_state"):
        if "user" in st.session_state:
            del st.session_state["user"]


def get_current_user() -> Optional[Dict[str, Any]]:
    """Return currently authenticated user from session state or None."""
    if st is not None and hasattr(st, "session_state"):
        return st.session_state.get("user")
    return None


def is_authenticated() -> bool:
    """Check if a user is currently logged in."""
    return get_current_user() is not None
