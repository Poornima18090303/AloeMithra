"""
SQLite Database module for AloeMithra.
Manages user accounts, authentication data, and leaf analysis history.
"""

import sqlite3
from pathlib import Path
from typing import Optional, List, Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "aloemithra.db"


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Returns a SQLite connection with foreign keys enabled and row_factory set."""
    path = db_path or DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[Path] = None) -> None:
    """Create users and history tables if they do not exist."""
    conn = get_connection(db_path)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                condition TEXT,
                confidence REAL,
                second_label TEXT,
                second_confidence REAL,
                status TEXT,
                language TEXT,
                thumbnail BLOB,
                consent_photo_saved INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
    conn.close()


def create_user(username: str, password_hash: str, language: str = "en", db_path: Optional[Path] = None) -> Optional[int]:
    """Create a new user. Returns user_id if successful, None if username already exists."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                "INSERT INTO users (username, password_hash, language) VALUES (?, ?, ?)",
                (username.strip(), password_hash, language)
            )
            return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_username(username: str, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retrieve user dictionary by username."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT id, username, password_hash, language, created_at FROM users WHERE username = ?",
            (username.strip(),)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retrieve user dictionary by user ID."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT id, username, password_hash, language, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_user_language(user_id: int, language: str, db_path: Optional[Path] = None) -> bool:
    """Update user's preferred language."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                "UPDATE users SET language = ? WHERE id = ?",
                (language, user_id)
            )
            return cursor.rowcount > 0
    finally:
        conn.close()


def add_history_record(
    user_id: int,
    condition: Optional[str],
    confidence: float,
    second_label: Optional[str],
    second_confidence: float,
    status: str,
    language: str,
    thumbnail_bytes: Optional[bytes] = None,
    consent_photo_saved: bool = False,
    db_path: Optional[Path] = None
) -> int:
    """Add a new analysis result to history."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO history (
                    user_id, condition, confidence, second_label, second_confidence,
                    status, language, thumbnail, consent_photo_saved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    condition,
                    confidence,
                    second_label,
                    second_confidence,
                    status,
                    language,
                    thumbnail_bytes if consent_photo_saved else None,
                    1 if consent_photo_saved else 0
                )
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_user_history(user_id: int, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retrieve full history for a user sorted latest first."""
    conn = get_connection(db_path)
    try:
        cursor = conn.execute(
            """
            SELECT id, user_id, timestamp, condition, confidence, second_label,
                   second_confidence, status, language, thumbnail, consent_photo_saved
            FROM history
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def delete_history_record(record_id: int, user_id: int, db_path: Optional[Path] = None) -> bool:
    """Delete a single history entry belonging to user_id."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                "DELETE FROM history WHERE id = ? AND user_id = ?",
                (record_id, user_id)
            )
            return cursor.rowcount > 0
    finally:
        conn.close()


def clear_user_history(user_id: int, db_path: Optional[Path] = None) -> bool:
    """Delete all history entries belonging to user_id."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.execute(
                "DELETE FROM history WHERE user_id = ?",
                (user_id,)
            )
            return cursor.rowcount > 0
    finally:
        conn.close()
