"""Management command to seed demo posts."""
from __future__ import annotations

import random
from typing import Dict

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import Category, Post, Tag
from ...seed_config import (
    POST_COUNT,
    CATEGORIES_POOL,
    TAGS_POOL,
    get_faker,
    is_seed_allowed,
)
from ...utils.i18n import slugify_localized


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
        available_languages = [
            code for code, _name in getattr(settings, "LANGUAGES", ())
        ]
        if not available_languages:
            available_languages = [default_language]
        elif default_language not in available_languages:
            available_languages.insert(0, default_language)

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

            def _ensure_tag(name: str) -> Tag:
                tag = (
                    Tag.objects.language(default_language)
                    .filter(name=name)
                    .first()
                )
                if tag is None:
                    tag = Tag()

                base_slug = slugify_localized(name, default_language) or Tag.slug_fallback

                def _save_translation(language_code: str, *, force: bool = False) -> None:
                    translation = tag._get_translated_model(
                        language_code, auto_create=True
                    )

                    tag.set_current_language(language_code)

                    current_name = getattr(translation, "name", "") or ""
                    current_slug = getattr(translation, "slug", "") or ""

                    candidate_slug = (
                        slugify_localized(name, language_code) or base_slug
                    )

                    if force or not current_name.strip():
                        tag.name = name
                    if force or not current_slug.strip():
                        tag.slug = candidate_slug or base_slug

                    if not tag.slug:
                        tag.slug = base_slug

                    tag.save()

                _save_translation(default_language, force=True)
                for language_code in available_languages:
                    if language_code == default_language:
                        continue
                    _save_translation(language_code)
                tag.set_current_language(default_language)
                return tag

            for name in TAGS_POOL:
                tag_lookup[name] = _ensure_tag(name)

            category_lookup = {}

            def _ensure_category(slug: str) -> Category:
                category = (
                    Category.objects.language(default_language)
                    .filter(slug=slug)
                    .first()
                )
                if category is None:
                    category = Category()

                base_name = category_defaults[slug]

                def _save_category_translation(language_code: str, *, force: bool = False) -> None:
                    current_name = category.safe_translation_getter(
                        "name",
                        language_code=language_code,
                        any_language=False,
                    )
                    current_slug = category.safe_translation_getter(
                        "slug",
                        language_code=language_code,
                        any_language=False,
                    )

                    category.set_current_language(language_code)

                    if force or not current_name:
                        category.name = base_name
                    if force or not current_slug:
                        category.slug = slug

                    if not category.slug:
                        category.slug = slug

                    category.save()

                _save_category_translation(default_language, force=True)
                for language_code in available_languages:
                    if language_code == default_language:
                        continue
                    _save_category_translation(language_code)
                category.set_current_language(default_language)
                return category

            for slug in category_slugs:
                category_lookup[slug] = _ensure_category(slug)

            while created < target and attempts < max_attempts:
                attempts += 1
                title = faker.sentence(nb_words=random.randint(6, 11)).rstrip(".")
                if title in existing_titles:
                    skipped += 1
                    continue

                base_slug = (
                    slugify_localized(title, default_language)
                    or slugify_localized(faker.sentence(nb_words=4), default_language)
                    or Post.slug_fallback
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

                for language_code in available_languages:
                    if language_code == default_language:
                        continue

                    translation = post._get_translated_model(
                        language_code, auto_create=True
                    )

                    if not (translation.title or "").strip():
                        translation.title = title
                    if not (translation.slug or "").strip():
                        translation.slug = slug
                    if not (translation.excerpt or "").strip():
                        translation.excerpt = excerpt
                    if not (translation.content or "").strip():
                        translation.content = content

                    post.set_current_language(language_code)

                    if not post.slug:
                        post.slug = slug

                    post.save()

                post.set_current_language(default_language)

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
