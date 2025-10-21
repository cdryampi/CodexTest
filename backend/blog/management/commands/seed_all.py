"""Aggregate command to execute all seeders in order."""
from __future__ import annotations

from typing import Dict

from django.core.management import get_commands, load_command_class
from django.core.management.base import BaseCommand, CommandError, OutputWrapper
from django.core.management.color import color_style, no_style
from django.db import DEFAULT_DB_ALIAS, connections, transaction

from ...models import Category, Comment, Post, Tag
from ...seed_config import (
    COMMENTS_PER_POST_MAX,
    COMMENTS_PER_POST_MIN,
    POST_COUNT,
    USER_COUNT,
    is_seed_allowed,
)


FAST_PRESET = {
    "users": 12,
    "posts": 40,
    "comments_min": 1,
    "comments_max": 3,
}


class Command(BaseCommand):
    help = "Ejecuta todos los comandos de semillas del blog garantizando idempotencia."

    def execute(self, *args, **options):  # pragma: no cover - behavioral parity tweak
        """Replica la lógica base evitando imprimir resúmenes dictados."""

        if options["force_color"] and options["no_color"]:
            raise CommandError(
                "The --no-color and --force-color options can't be used together."
            )
        if options["force_color"]:
            self.style = color_style(force_color=True)
        elif options["no_color"]:
            self.style = no_style()
            self.stderr.style_func = None
        if options.get("stdout"):
            self.stdout = OutputWrapper(options["stdout"])
        if options.get("stderr"):
            self.stderr = OutputWrapper(options["stderr"])

        if self.requires_system_checks and not options["skip_checks"]:
            check_kwargs = self.get_check_kwargs(options)
            self.check(**check_kwargs)
        if self.requires_migrations_checks:
            self.check_migrations()

        output = self.handle(*args, **options)
        if output and not isinstance(output, dict):
            if self.output_transaction:
                connection = connections[options.get("database", DEFAULT_DB_ALIAS)]
                output = "%s\n%s\n%s" % (
                    self.style.SQL_KEYWORD(connection.ops.start_transaction_sql()),
                    output,
                    self.style.SQL_KEYWORD(connection.ops.end_transaction_sql()),
                )
            self.stdout.write(output)
        return output

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

        self.stdout.write("Reiniciando posts, categorías y tags del blog...")
        with transaction.atomic():
            Comment.objects.all().delete()
            Post.objects.all().delete()
            Category.objects.all().delete()
            Tag.objects.all().delete()

        verbosity = int(options.get("verbosity", 1))
        domain = options.get("domain", "example.com")

        available_commands = get_commands()

        def run_seed_command(name: str, **command_options):
            """Ejecuta un comando de seeds y devuelve su resumen."""

            try:
                app_name = available_commands[name]
            except KeyError as exc:  # pragma: no cover - defensive guard
                raise CommandError(
                    f"El comando '{name}' no está disponible en esta instalación."
                ) from exc

            command = load_command_class(app_name, name)
            command.stdout = self.stdout
            command.stderr = self.stderr
            command.style = self.style
            summary = command.handle(**command_options)
            if summary is None:
                return {"created": 0, "skipped": 0}
            if not isinstance(summary, dict):  # pragma: no cover - future proofing
                raise CommandError(
                    "Los comandos de semillas deben devolver un diccionario con el resumen"
                )
            return summary

        self.stdout.write("Iniciando ejecución de seeds...")
        categories_summary = run_seed_command(
            "seed_categories",
            verbosity=verbosity,
        )
        users_summary = run_seed_command(
            "seed_users",
            count=counts["users"],
            domain=domain,
            verbosity=verbosity,
        )
        posts_summary = run_seed_command(
            "seed_posts",
            count=counts["posts"],
            verbosity=verbosity,
        )
        comments_summary = run_seed_command(
            "seed_comments",
            per_post_min=counts["comments_min"],
            per_post_max=counts["comments_max"],
            verbosity=verbosity,
        )

        summary = {
            "categories": categories_summary or {"created": 0, "updated": 0},
            "users": users_summary or {"created": 0, "skipped": 0},
            "posts": posts_summary or {"created": 0, "skipped": 0},
            "comments": comments_summary or {"created": 0, "skipped": 0},
        }

        self.stdout.write(self.style.SUCCESS("Seeds ejecutadas correctamente."))
        for section, data in summary.items():
            created = data.get("created", 0)
            if "updated" in data:
                self.stdout.write(
                    f"- {section}: {created} nuevos, {data.get('updated', 0)} actualizados"
                )
            else:
                skipped = data.get("skipped", 0)
                self.stdout.write(f"- {section}: {created} nuevos, {skipped} omitidos")

        return summary
