"""Signal handlers for the blog app."""
from __future__ import annotations

import logging
from typing import Final

from allauth.account.signals import user_signed_up
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management import call_command
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .seed_config import is_seed_allowed, should_seed_on_migrate

logger = logging.getLogger(__name__)

_ALREADY_TRIGGERED = False
_DEFAULT_FROM_EMAIL: Final[str] = (
    getattr(settings, "DEFAULT_FROM_EMAIL", None)
    or getattr(settings, "EMAIL_HOST_USER", "")
    or "no-reply@codextest.local"
)


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


@receiver(user_signed_up)
def send_welcome_email(sender, request, user, **kwargs):  # type: ignore[unused-argument]
    """Send a welcome email to every new account created via registration."""

    if not getattr(user, "email", None):
        logger.info("Usuario %s sin email. Se omite bienvenida.", user.pk)
        return

    display_name = user.get_full_name().strip() if user.get_full_name() else ""
    if not display_name:
        display_name = getattr(user, "username", None) or user.email

    subject = "Bienvenido/a a CodexTest Blog"
    text_body = (
        f"Hola {display_name},\n\n"
        "Gracias por registrarte en CodexTest Blog. Desde ahora podrás comentar "
        "y guardar tus publicaciones favoritas.\n\n"
        "¡Nos encanta tenerte por aquí!\n"
        "El equipo de CodexTest"
    )
    html_body = (
        "<p>Hola <strong>{name}</strong>,</p>"
        "<p>Gracias por registrarte en CodexTest Blog. Ya puedes iniciar sesión para "
        "guardar publicaciones y participar en la comunidad.</p>"
        "<p>¡Nos encanta tenerte por aquí!<br />El equipo de CodexTest</p>"
    ).format(name=display_name)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=_DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")

    try:
        message.send()
    except Exception:  # pragma: no cover - solo logging
        logger.exception("No se pudo enviar email de bienvenida a %s", user.email)
    else:
        logger.info("Email de bienvenida enviado correctamente a %s", user.email)
