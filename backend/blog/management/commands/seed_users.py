"""Management command to seed demo users."""
from __future__ import annotations

from typing import Dict

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from ...seed_config import DEFAULT_PASSWORD, USER_COUNT, get_faker, is_seed_allowed


class Command(BaseCommand):
    help = "Crea usuarios de prueba no administrativos de forma idempotente."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=USER_COUNT,
            help="Número de usuarios nuevos a generar.",
        )
        parser.add_argument(
            "--domain",
            type=str,
            default="example.com",
            help="Dominio a utilizar para los correos electrónicos generados.",
        )

    def handle(self, *args, **options) -> Dict[str, int]:
        if not is_seed_allowed():
            self.stdout.write(
                self.style.WARNING(
                    "Semillas deshabilitadas. Usa ALLOW_SEED=true o DEBUG para permitirlas."
                )
            )
            return {"created": 0, "skipped": 0, "target": 0}

        target = max(0, int(options.get("count") or 0))
        domain = str(options.get("domain") or "example.com").lower()
        if target == 0:
            self.stdout.write("Sin usuarios solicitados; no se realizaron cambios.")
            return {"created": 0, "skipped": 0, "target": 0}

        faker = get_faker()
        user_model = get_user_model()
        existing_usernames = set(user_model.objects.values_list("username", flat=True))
        existing_emails = set(user_model.objects.values_list("email", flat=True))

        created = 0
        skipped = 0
        max_attempts = target * 10
        attempts = 0

        self.stdout.write(f"Generando {target} usuarios con dominio {domain}...")

        with transaction.atomic():
            while created < target and attempts < max_attempts:
                attempts += 1
                first_name = faker.first_name()
                last_name = faker.last_name()
                base_username = slugify(f"{first_name}-{last_name}") or slugify(faker.user_name())
                if not base_username:
                    base_username = faker.pystr(min_chars=6, max_chars=12).lower()

                username = base_username
                suffix = 1
                while username in existing_usernames:
                    suffix += 1
                    username = f"{base_username}-{suffix}"

                email = f"{username}@{domain}".replace("--", "-")
                if email in existing_emails:
                    skipped += 1
                    continue

                defaults = {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_staff": False,
                    "is_superuser": False,
                    "password": make_password(DEFAULT_PASSWORD),
                }

                user, was_created = user_model.objects.get_or_create(
                    username=username,
                    defaults=defaults,
                )

                if was_created:
                    existing_usernames.add(username)
                    existing_emails.add(email)
                    created += 1
                else:
                    skipped += 1

        if attempts >= max_attempts and created < target:
            self.stdout.write(
                self.style.WARNING(
                    "Se alcanzó el límite de intentos antes de cumplir con la cuota solicitada."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Usuarios creados: {created}. Omitidos por existir previamente: {skipped}."
            )
        )
        return {"created": created, "skipped": skipped, "target": target}
