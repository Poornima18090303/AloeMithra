"""
Unit tests for Phase 3: Knowledge Base schema validation, research safety compliance,
and Result layout contract enforcement.
"""

import pytest
from core.knowledge import (
    get_condition_data,
    list_all_conditions,
    validate_kb_entry,
    REQUIRED_MANAGEMENT_SECTIONS
)


def test_list_all_conditions():
    """Verify that all 5 conditions are present and loaded."""
    conditions = list_all_conditions()
    assert len(conditions) == 5
    slugs = {c["slug"] for c in conditions}
    assert slugs == {"aloe_rust", "anthracnose", "healthy", "leaf_spot", "sunburn"}


def test_schema_validation_all_conditions():
    """Every knowledge base file must strictly pass schema validation with zero errors."""
    conditions = list_all_conditions()
    for condition in conditions:
        errors = validate_kb_entry(condition)
        assert len(errors) == 0, f"Validation errors in {condition.get('slug')}: {errors}"


def test_required_management_sections():
    """Every condition must include all 5 management sections with non-empty step lists."""
    conditions = list_all_conditions()
    for cond in conditions:
        mgmt = cond["management"]
        for section in REQUIRED_MANAGEMENT_SECTIONS:
            assert section in mgmt, f"Missing section '{section}' in {cond['condition']}"
            assert isinstance(mgmt[section], list)
            assert len(mgmt[section]) > 0
            for step in mgmt[section]:
                assert "step" in step and len(step["step"]) > 0
                assert "evidence_level" in step
                assert "sources" in step and isinstance(step["sources"], list)


def test_biological_chemical_placeholders():
    """All chemical and biological steps must use the reviewed research placeholder."""
    expected_placeholder = "To be added from reviewed research sources."
    conditions = list_all_conditions()
    for cond in conditions:
        mgmt = cond["management"]
        for section in ["biological", "chemical"]:
            steps = mgmt[section]
            assert len(steps) >= 1
            assert steps[0]["step"] == expected_placeholder
            assert steps[0]["evidence_level"] == "none"
            assert steps[0]["sources"] == []


def test_sunburn_safety_constraints():
    """Sunburn is an abiotic environmental condition: no fungicides may ever be suggested."""
    sunburn = get_condition_data("Sunburn")
    assert sunburn is not None
    assert sunburn["type"] == "environmental"

    all_steps = []
    for section_steps in sunburn["management"].values():
        for item in section_steps:
            all_steps.append(item["step"].lower())

    text = " ".join(all_steps)
    # Check that fungicides are specifically ruled out or not prescribed
    assert "fungicide" not in text or "do not treat with fungicides" in text
    # Midday sun protection must be included
    assert "sun" in text


def test_healthy_preventive_only():
    """Healthy aloe leaves have no disease treatments, only routine maintenance."""
    healthy = get_condition_data("Healthy")
    assert healthy is not None
    assert healthy["type"] == "healthy"
    
    sanitation = healthy["management"]["sanitation"][0]["step"]
    assert "routine" in sanitation.lower() or "senescent" in sanitation.lower()
