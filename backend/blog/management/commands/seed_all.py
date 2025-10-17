"""Aggregate command to execute all seeders in order."""
from __future__ import annotations

from typing import Dict

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from ...models import Comment, Post, Tag
from ...seed_config import (
    COMMENTS_PER_POST_MAX,
    COMMENTS_PER_POST_MIN,
    POST_COUNT,
    USER_COUNT,
    is_seed_allowed,
    is_seed_reset_allowed,
)


FAST_PRESET = {
    "users": 12,
    "posts": 40,
    "comments_min": 1,
    "comments_max": 3,
}


class Command(BaseCommand):
    help = "Ejecuta todos los comandos de semillas del blog garantizando idempotencia."

    def add_arguments(self, parser):
        parser.add_argument(
            "--users",
            type=int,
            help="Número de usuarios a generar (sobrescribe el valor por defecto).",
        )
        parser.add_argument(
            "--posts",
            type=int,
            help="Número de posts a generar (sobrescribe el valor por defecto).",
        )
        parser.add_argument(
            "--comments",
            type=int,
            help="Máximo de comentarios a crear por post.",
        )
        parser.add_argument(
            "--fast",
            action="store_true",
            help="Utiliza un tamaño reducido de datos para pruebas rápidas.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Borra posts, tags y comentarios antes de sembrar (requiere ALLOW_SEED_RESET=true).",
        )
        parser.add_argument(
            "--domain",
            type=str,
            default="example.com",
            help="Dominio a utilizar para los usuarios generados.",
        )

    def handle(self, *args, **options) -> Dict[str, Dict[str, int]]:
        if not is_seed_allowed():
            self.stdout.write(
                self.style.WARNING(
                    "Semillas deshabilitadas. Usa ALLOW_SEED=true o DEBUG para permitirlas."
                )
            )
            return {}

        counts = {
            "users": USER_COUNT,
            "posts": POST_COUNT,
            "comments_min": COMMENTS_PER_POST_MIN,
            "comments_max": COMMENTS_PER_POST_MAX,
        }
        if options.get("fast"):
            counts.update(FAST_PRESET)

        if options.get("users") is not None:
            counts["users"] = max(0, int(options["users"]))
        if options.get("posts") is not None:
            counts["posts"] = max(0, int(options["posts"]))
        if options.get("comments") is not None:
            override = max(0, int(options["comments"]))
            counts["comments_max"] = override
            counts["comments_min"] = min(counts["comments_min"], override)

        if options.get("reset"):
            if not is_seed_reset_allowed():
                raise CommandError(
                    "El reseteo de datos no está permitido. Exporta ALLOW_SEED_RESET=true para habilitarlo."
                )
            self.stdout.write("Eliminando posts, comentarios y tags existentes...")
            with transaction.atomic():
                Comment.objects.all().delete()
                Post.objects.all().delete()
                Tag.objects.all().delete()

        verbosity = int(options.get("verbosity", 1))
        domain = options.get("domain", "example.com")

        self.stdout.write("Iniciando ejecución de seeds...")
        users_summary = call_command(
            "seed_users",
            count=counts["users"],
            domain=domain,
            verbosity=verbosity,
        )
        posts_summary = call_command(
            "seed_posts",
            count=counts["posts"],
            verbosity=verbosity,
        )
        comments_summary = call_command(
            "seed_comments",
            per_post_min=counts["comments_min"],
            per_post_max=counts["comments_max"],
            verbosity=verbosity,
        )

        summary = {
            "users": users_summary or {"created": 0, "skipped": 0},
            "posts": posts_summary or {"created": 0, "skipped": 0},
            "comments": comments_summary or {"created": 0, "skipped": 0},
        }

        self.stdout.write(self.style.SUCCESS("Seeds ejecutadas correctamente."))
        for section, data in summary.items():
            created = data.get("created", 0)
            skipped = data.get("skipped", 0)
            self.stdout.write(f"- {section}: {created} nuevos, {skipped} omitidos")

        return summary
