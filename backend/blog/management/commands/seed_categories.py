"""Seed base categories from fixtures ensuring idempotency."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q

from ...models import Category
from ...utils.i18n import slugify_localized

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

        default_language = settings.LANGUAGE_CODE
        available_languages = [
            code for code, _name in getattr(settings, "LANGUAGES", ())
        ]
        if not available_languages:
            available_languages = [default_language]
        elif default_language not in available_languages:
            available_languages.insert(0, default_language)

        with transaction.atomic():
            for entry in payload:
                fields = entry.get("fields", {})
                name = fields.get("name")
                if not name:
                    continue

                description = fields.get("description", "")
                is_active = bool(fields.get("is_active", True))
                entry_language = fields.get("language_code") or default_language
                entry_language = (
                    entry_language if entry_language in available_languages else default_language
                )

                slug_value = (
                    fields.get("slug")
                    or slugify_localized(name, entry_language)
                    or Category.slug_fallback
                )

                language_manager = Category.objects.language(entry_language)
                category = language_manager.filter(
                    Q(slug=slug_value) | Q(name=name)
                ).first()

                if category is None:
                    category = Category()
                    created_flag = True
                else:
                    created_flag = False

                category.is_active = is_active

                def _save_translation(language_code: str) -> None:
                    category.set_current_language(language_code)
                    if not category.name:
                        category.name = name
                    if not category.description:
                        category.description = description
                    if not category.slug:
                        category.slug = slug_value
                    # Ensure canonical language matches fixture values
                    if language_code == entry_language:
                        category.name = name
                        category.description = description
                        category.slug = slug_value
                    category.save()

                _save_translation(entry_language)

                for language_code in available_languages:
                    if language_code == entry_language:
                        continue
                    _save_translation(language_code)

                category.set_current_language(default_language)

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
