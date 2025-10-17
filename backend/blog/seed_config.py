"""Configuration helpers for seeding commands."""
from __future__ import annotations

import os
from typing import Tuple

from django.conf import settings


def _is_env_flag_true(value: str) -> bool:
    return value.lower() in {"1", "true", "yes"}


POST_COUNT = 300
COMMENTS_PER_POST_MIN = 3
COMMENTS_PER_POST_MAX = 12
USER_COUNT = 40
STATIC_SEED_MODE = _is_env_flag_true(os.getenv("STATIC_SEED_MODE", "true"))
TAGS_POOL = [
    "django",
    "react",
    "devops",
    "docker",
    "ciencia",
    "filosofia",
    "tutorial",
]
FAKER_LOCALE = "es_ES"
DEFAULT_PASSWORD = "password123"
BULK_BATCH_SIZE = 500


def is_seed_allowed() -> bool:
    """Return True if the current environment allows running seeds."""

    if STATIC_SEED_MODE:
        return True

    allow_seed = _is_env_flag_true(os.getenv("ALLOW_SEED", "false"))
    return bool(getattr(settings, "DEBUG", False) or allow_seed)


def is_seed_reset_allowed() -> bool:
    return _is_env_flag_true(os.getenv("ALLOW_SEED_RESET", "false"))


def should_seed_on_migrate() -> bool:
    return _is_env_flag_true(os.getenv("SEED_ON_MIGRATE", "false"))


def get_faker() -> "Faker":
    from faker import Faker

    return Faker(locale=FAKER_LOCALE)


def clamp_comment_range(
    minimum: int, maximum: int
) -> Tuple[int, int]:
    """Sanitise comment ranges ensuring min/max consistency."""

    minimum = max(0, int(minimum))
    maximum = max(minimum, int(maximum))
    return minimum, maximum
