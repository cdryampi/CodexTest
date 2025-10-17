"""Signal handlers for the blog app."""
from __future__ import annotations

import logging

from django.core.management import call_command
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .seed_config import is_seed_allowed, should_seed_on_migrate

logger = logging.getLogger(__name__)

_ALREADY_TRIGGERED = False


@receiver(post_migrate)
def run_seeds_after_migrate(sender, **kwargs):  # type: ignore[unused-argument]
    """Execute the aggregate seeding command after migrations when enabled."""

    global _ALREADY_TRIGGERED
    if _ALREADY_TRIGGERED:
        return

    if not should_seed_on_migrate():
        return

    if not is_seed_allowed():
        logger.info("Semillas post-migrate omitidas: entorno no autorizado.")
        return

    _ALREADY_TRIGGERED = True
    logger.info("Ejecutando seeds automáticos tras migrate...")

    try:
        call_command("seed_all")
    except Exception:  # pragma: no cover - solo logging
        _ALREADY_TRIGGERED = True
        logger.exception("Fallo al ejecutar seed_all después de las migraciones.")
    else:
        logger.info("Seeds automáticas completadas correctamente.")
