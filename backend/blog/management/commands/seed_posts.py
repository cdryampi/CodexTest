"""Management command to seed demo posts."""
from __future__ import annotations

import random
from typing import Dict, List

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from ...models import Category, Post, Tag
from ...seed_config import (
    BULK_BATCH_SIZE,
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
        existing_titles = set(Post.objects.values_list("title", flat=True))
        existing_slugs = set(Post.objects.values_list("slug", flat=True))
        posts_to_create: List[Post] = []
        post_tags: Dict[str, List[str]] = {}
        post_categories: Dict[str, List[str]] = {}
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
            Tag.objects.bulk_create(
                [Tag(name=name) for name in TAGS_POOL],
                ignore_conflicts=True,
            )
            Category.objects.bulk_create(
                [
                    Category(name=category_defaults[slug], slug=slug)
                    for slug in category_slugs
                ],
                ignore_conflicts=True,
            )

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

                posts_to_create.append(
                    Post(
                        title=title,
                        slug=slug,
                        excerpt=excerpt,
                        content=content,
                        date=publish_date,
                        image=image_url,
                        thumb=thumb_url,
                        imageAlt=image_alt,
                        author=author,
                    )
                )
                post_tags[slug] = tags
                post_categories[slug] = categories
                existing_titles.add(title)
                existing_slugs.add(slug)
                created += 1

            if not posts_to_create:
                self.stdout.write("No se encontraron posts nuevos para crear.")
                return {"created": 0, "skipped": skipped, "target": target}

            Post.objects.bulk_create(
                posts_to_create,
                batch_size=BULK_BATCH_SIZE,
            )

            tag_lookup = {
                tag.name: tag for tag in Tag.objects.filter(name__in=TAGS_POOL)
            }
            category_lookup = {
                category.slug: category
                for category in Category.objects.filter(slug__in=category_slugs)
            }
            created_posts = {
                post.slug: post
                for post in Post.objects.filter(slug__in=list(post_tags.keys()))
            }
            for slug, tag_names in post_tags.items():
                post = created_posts.get(slug)
                if not post:
                    continue
                post.tags.set([tag_lookup[name] for name in tag_names if name in tag_lookup])
                post.categories.set(
                    [
                        category_lookup[category_slug]
                        for category_slug in post_categories.get(slug, [])
                        if category_slug in category_lookup
                    ]
                )

        if attempts >= max_attempts and created < target:
            self.stdout.write(
                self.style.WARNING(
                    "Se alcanzó el límite de intentos antes de cumplir con la cuota solicitada."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Posts creados: {len(posts_to_create)}. Omitidos por títulos repetidos: {skipped}."
            )
        )
        return {
            "created": len(posts_to_create),
            "skipped": skipped,
            "target": target,
        }

    def _build_excerpt(self, faker) -> str:
        excerpt = " ".join(faker.sentences(nb=random.randint(3, 5)))
        while len(excerpt) < 160:
            excerpt += " " + faker.sentence(nb_words=10)
        return excerpt[:220]
