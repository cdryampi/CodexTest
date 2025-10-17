"""Management command to seed comments for posts."""
from __future__ import annotations

import random
from typing import Dict, Set

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from ...models import Comment, Post
from ...seed_config import (
    BULK_BATCH_SIZE,
    COMMENTS_PER_POST_MAX,
    COMMENTS_PER_POST_MIN,
    clamp_comment_range,
    get_faker,
    is_seed_allowed,
)


class Command(BaseCommand):
    help = "Agrega comentarios ficticios a los posts existentes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--per-post-min",
            type=int,
            default=COMMENTS_PER_POST_MIN,
            help="Cantidad mínima de comentarios por post.",
        )
        parser.add_argument(
            "--per-post-max",
            type=int,
            default=COMMENTS_PER_POST_MAX,
            help="Cantidad máxima de comentarios por post.",
        )

    def handle(self, *args, **options) -> Dict[str, int]:
        if not is_seed_allowed():
            self.stdout.write(
                self.style.WARNING(
                    "Semillas deshabilitadas. Usa ALLOW_SEED=true o DEBUG para permitirlas."
                )
            )
            return {"created": 0, "skipped": 0, "target": 0}

        per_post_min, per_post_max = clamp_comment_range(
            options.get("per_post_min", COMMENTS_PER_POST_MIN),
            options.get("per_post_max", COMMENTS_PER_POST_MAX),
        )

        if per_post_max == 0:
            self.stdout.write("El máximo por post es 0; no se generarán comentarios.")
            return {"created": 0, "skipped": 0, "target": 0}

        posts = list(Post.objects.all())
        if not posts:
            self.stdout.write("No hay posts disponibles para comentar.")
            return {"created": 0, "skipped": 0, "target": 0}

        faker = get_faker()
        signatures: Set[str] = {
            self._build_signature(row["post_id"], row["author_name"], row["content"])
            for row in Comment.objects.values("post_id", "author_name", "content")
        }

        new_comments = []
        skipped = 0

        for post in posts:
            desired = random.randint(per_post_min, per_post_max)
            for _ in range(desired):
                author_name = faker.name()
                content = faker.paragraph(nb_sentences=random.randint(2, 5))
                signature = self._build_signature(post.id, author_name, content)
                if signature in signatures:
                    skipped += 1
                    continue

                created_at = faker.date_time_between(
                    start_date="-1y",
                    end_date="now",
                    tzinfo=timezone.get_current_timezone(),
                )
                new_comments.append(
                    Comment(
                        post=post,
                        author_name=author_name,
                        content=content,
                        created_at=created_at,
                    )
                )
                signatures.add(signature)

        if not new_comments:
            self.stdout.write("No se encontraron comentarios nuevos para crear.")
            return {"created": 0, "skipped": skipped, "target": 0}

        with transaction.atomic():
            Comment.objects.bulk_create(
                new_comments,
                batch_size=BULK_BATCH_SIZE,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Comentarios creados: {len(new_comments)}. Omitidos por duplicados: {skipped}."
            )
        )
        return {
            "created": len(new_comments),
            "skipped": skipped,
            "target": per_post_max,
        }

    def _build_signature(self, post_id: int, author_name: str, content: str) -> str:
        snippet = (content or "")[:80]
        return f"{post_id}|{author_name}|{snippet}"
