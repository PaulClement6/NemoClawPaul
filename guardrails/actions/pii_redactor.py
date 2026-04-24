"""
Lot 3: Custom PII detection and redaction action for NeMo Guardrails.

This action scans text for common PII patterns (SSN, credit card, phone,
email, etc.) and replaces them with redaction placeholders.

Dependencies (Lot 3):
    pip install nemoguardrails
"""

import re
from typing import Optional

# from nemoguardrails.actions import action


# PII patterns and their replacement tokens
PII_PATTERNS = {
    "ssn": {
        "pattern": r"\b\d{3}-\d{2}-\d{4}\b",
        "replacement": "[SSN REDACTED]",
    },
    "credit_card": {
        "pattern": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
        "replacement": "[CREDIT CARD REDACTED]",
    },
    "phone": {
        "pattern": r"\b(?:\+1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b",
        "replacement": "[PHONE REDACTED]",
    },
    "email": {
        "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "replacement": "[EMAIL REDACTED]",
    },
    "drivers_license": {
        "pattern": r"\b[A-Z]\d{7,8}\b",
        "replacement": "[DL REDACTED]",
    },
}


# @action()
async def pii_redactor(text: Optional[str] = None) -> str:
    """Detect and redact PII from the given text.

    Args:
        text: The text to scan for PII.

    Returns:
        The text with PII patterns replaced by redaction tokens.
    """
    if not text:
        return ""

    redacted = text
    for pii_type, config in PII_PATTERNS.items():
        redacted = re.sub(config["pattern"], config["replacement"], redacted)

    return redacted


# TODO: Lot 3 — Register this action with NeMo Guardrails
# The @action() decorator (currently commented out) will register
# this function as a callable action in Colang flows.
# Uncomment when nemoguardrails is installed.
