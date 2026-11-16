"""
Knowledge Base reader and validation module for AloeMithra.
Loads condition details strictly from data/knowledge_base/*.json.
Enforces schema validation and research safety rules.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List

BASE_DIR = Path(__file__).resolve().parent.parent
KB_DIR = BASE_DIR / "data" / "knowledge_base"

SLUG_MAP = {
    "aloe rust": "aloe_rust.json",
    "aloe_rust": "aloe_rust.json",
    "anthracnose": "anthracnose.json",
    "healthy": "healthy.json",
    "leaf spot": "leaf_spot.json",
    "leaf_spot": "leaf_spot.json",
    "sunburn": "sunburn.json",
}

REQUIRED_MANAGEMENT_SECTIONS = [
    "sanitation",
    "cultural",
    "biological",
    "chemical",
    "precautions",
]

_kb_cache: Dict[str, Dict[str, Any]] = {}


def get_condition_data(condition_name: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve knowledge base JSON entry for a given condition name or slug.
    Returns None if no matching file exists.
    """
    if not condition_name:
        return None

    normalized_key = condition_name.strip().lower()
    filename = SLUG_MAP.get(normalized_key)
    if not filename:
        clean_name = normalized_key.replace(" ", "_")
        filename = f"{clean_name}.json"

    if filename in _kb_cache:
        return _kb_cache[filename]

    file_path = KB_DIR / filename
    if not file_path.exists():
        return None

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            _kb_cache[filename] = data
            return data
    except Exception as e:
        print(f"Error loading knowledge base file {file_path}: {e}")
        return None


def list_all_conditions() -> List[Dict[str, Any]]:
    """Returns a list of all loaded condition profiles."""
    conditions = []
    for filepath in sorted(KB_DIR.glob("*.json")):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                conditions.append(data)
        except Exception:
            continue
    return conditions


def validate_kb_entry(data: Dict[str, Any]) -> List[str]:
    """
    Validates that a knowledge base entry conforms to all required schema
    and safety constraints. Returns a list of validation error strings.
    """
    errors = []

    # Required top-level fields
    for field in ["condition", "slug", "type", "status", "description", "symptoms", "management"]:
        if field not in data:
            errors.append(f"Missing required field '{field}'.")

    # Status must be DRAFT_NEEDS_EXPERT_REVIEW
    if data.get("status") != "DRAFT_NEEDS_EXPERT_REVIEW":
        errors.append(f"Status must be 'DRAFT_NEEDS_EXPERT_REVIEW', got '{data.get('status')}'.")

    # Type validation
    if data.get("type") not in ["disease", "environmental", "healthy"]:
        errors.append(f"Invalid type '{data.get('type')}'.")

    # Management sections validation
    mgmt = data.get("management", {})
    for section in REQUIRED_MANAGEMENT_SECTIONS:
        if section not in mgmt:
            errors.append(f"Missing management section '{section}'.")
        else:
            steps = mgmt[section]
            if not isinstance(steps, list) or len(steps) == 0:
                errors.append(f"Management section '{section}' must be a non-empty list.")
            else:
                for step_idx, step_obj in enumerate(steps):
                    if "step" not in step_obj:
                        errors.append(f"Missing 'step' in '{section}[{step_idx}]'.")
                    if "evidence_level" not in step_obj:
                        errors.append(f"Missing 'evidence_level' in '{section}[{step_idx}]'.")
                    if "sources" not in step_obj:
                        errors.append(f"Missing 'sources' in '{section}[{step_idx}]'.")

    # Safety checks
    if data.get("slug") == "sunburn":
        # Sunburn is abiotic environmental damage, never fungal: no fungicides
        dumped = json.dumps(data).lower()
        if "fungicide" in dumped and "do not treat with fungicides" not in dumped:
            errors.append("Sunburn entry must not recommend fungicides.")

    # Biological and Chemical sections must contain the placeholder
    for section in ["biological", "chemical"]:
        if section in mgmt and len(mgmt[section]) > 0:
            first_step = mgmt[section][0].get("step", "")
            if "To be added from reviewed research sources." not in first_step:
                errors.append(f"Section '{section}' must contain standard research placeholder.")

    return errors
