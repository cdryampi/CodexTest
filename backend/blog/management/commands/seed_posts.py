"""Management command to seed demo posts."""
from __future__ import annotations

import random
from typing import Dict

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from ...models import Category, Post, Tag
from ...seed_config import (
    POST_COUNT,
    CATEGORIES_POOL,
    TAGS_POOL,
    get_faker,
    is_seed_allowed,
)


class Command(BaseCommand):
    help = "Genera entradas de blog realistas con tags asociados."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=POST_COUNT,
            help="Número de posts nuevos que se intentarán crear.",
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
        if target == 0:
            self.stdout.write("Sin posts solicitados; no se realizaron cambios.")
            return {"created": 0, "skipped": 0, "target": 0}

        faker = get_faker()
        default_language = settings.LANGUAGE_CODE
        existing_titles = set(
            Post.objects.language(default_language).values_list("title", flat=True)
        )
        existing_slugs = set(
            Post.objects.language(default_language).values_list("slug", flat=True)
        )
        category_slugs = [entry["slug"] for entry in CATEGORIES_POOL]
        category_defaults = {
            entry["slug"]: entry["name"] for entry in CATEGORIES_POOL
        }

        created = 0
        skipped = 0
        attempts = 0
        max_attempts = target * 10

        self.stdout.write(f"Generando hasta {target} posts...")

        with transaction.atomic():
            tag_lookup = {}
            for name in TAGS_POOL:
                tag = (
                    Tag.objects.language(default_language)
                    .filter(name=name)
                    .first()
                )
                if tag is None:
                    tag = Tag()
                tag.set_current_language(default_language)
                tag.name = name
                tag.save()
                tag_lookup[name] = tag

            category_lookup = {}
            for slug in category_slugs:
                category = (
                    Category.objects.language(default_language)
                    .filter(slug=slug)
                    .first()
                )
                if category is None:
                    category = Category()
                category.set_current_language(default_language)
                category.name = category_defaults[slug]
                category.slug = slug
                category.save()
                category_lookup[slug] = category

            while created < target and attempts < max_attempts:
                attempts += 1
                title = faker.sentence(nb_words=random.randint(6, 11)).rstrip(".")
                if title in existing_titles:
                    skipped += 1
                    continue

                base_slug = (
                    slugify(title)
                    or slugify(faker.sentence(nb_words=4))
                    or "entrada"
                )
                slug = base_slug
                suffix = 2
                while slug in existing_slugs:
                    slug = f"{base_slug}-{suffix}"
                    suffix += 1

                excerpt = self._build_excerpt(faker)
                content = "\n\n".join(faker.paragraphs(nb=random.randint(6, 12)))
                publish_date = faker.date_between(start_date="-2y", end_date="today")
                author = faker.name()
                image_seed = slug.replace("-", "")[:16] or faker.pystr(min_chars=6, max_chars=12)
                image_url = f"https://picsum.photos/seed/{image_seed}/1200/800"
                thumb_url = f"https://picsum.photos/seed/{image_seed}-thumb/600/400"
                image_alt = faker.sentence(nb_words=8).rstrip(".")
                tags = random.sample(
                    TAGS_POOL, k=random.randint(2, min(5, len(TAGS_POOL)))
                )
                categories = random.sample(
                    category_slugs,
                    k=random.randint(1, min(3, len(category_slugs))),
                )

                post = Post()
                post.set_current_language(default_language)
                post.title = title
                post.slug = slug
                post.excerpt = excerpt
                post.content = content
                post.date = publish_date
                post.image = image_url
                post.thumb = thumb_url
                post.imageAlt = image_alt
                post.author = author
                post.save()

                post.tags.set(
                    [tag_lookup[name] for name in tags if name in tag_lookup]
                )
                post.categories.set(
                    [
                        category_lookup[category_slug]
                        for category_slug in categories
                        if category_slug in category_lookup
                    ]
                )

                existing_titles.add(post.title)
                existing_slugs.add(post.slug)
                created += 1

        if attempts >= max_attempts and created < target:
            self.stdout.write(
                self.style.WARNING(
                    "Se alcanzó el límite de intentos antes de cumplir con la cuota solicitada."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Posts creados: {created}. Omitidos por títulos repetidos: {skipped}."
            )
        )
        return {
            "created": created,
            "skipped": skipped,
            "target": target,
        }

    def _build_excerpt(self, faker) -> str:
        excerpt = " ".join(faker.sentences(nb=random.randint(3, 5)))
        while len(excerpt) < 160:
            excerpt += " " + faker.sentence(nb_words=10)
        return excerpt[:220]
