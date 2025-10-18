"""Seed base categories from fixtures ensuring idempotency."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from ...models import Category

FIXTURE_NAME = "categories.json"


class Command(BaseCommand):
    help = "Crea o actualiza las categorías base del blog de forma idempotente."

    def handle(self, *args, **options) -> Dict[str, int]:
        fixture_path = (
            Path(__file__)
            .resolve()
            .parent.parent.parent
            .joinpath("fixtures", FIXTURE_NAME)
        )
        if not fixture_path.exists():
            self.stdout.write(
                self.style.WARNING(
                    f"No se encontró el fixture {FIXTURE_NAME}; no se realizaron cambios."
                )
            )
            return {"created": 0, "updated": 0}

        with fixture_path.open("r", encoding="utf-8") as fixture_file:
            payload = json.load(fixture_file)

        created = 0
        updated = 0

        for entry in payload:
            fields = entry.get("fields", {})
            name = fields.get("name")
            if not name:
                continue

            slug = fields.get("slug") or slugify(name)
            description = fields.get("description", "")
            is_active = bool(fields.get("is_active", True))

            category, created_flag = Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": description,
                    "is_active": is_active,
                },
            )
            if created_flag:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Categorías sincronizadas. Nuevas: {created}. Actualizadas: {updated}."
            )
        )
        return {"created": created, "updated": updated}
