"""Data migration to populate parler translation tables."""
from __future__ import annotations

from django.conf import settings
from django.db import migrations

from blog.utils.i18n import slugify_localized


def _unique_slug(base_value: str, language_code: str, existing: set[str], fallback: str) -> str:
    base_slug = slugify_localized(base_value, language_code) or slugify_localized(fallback, language_code) or fallback
    candidate = base_slug or fallback
    suffix = 1
    while candidate in existing or not candidate:
        suffix += 1
        candidate = f"{base_slug or fallback}-{suffix}"
    existing.add(candidate)
    return candidate


def _copy_default_language(apps, schema_editor) -> None:
    language_code = settings.LANGUAGE_CODE

    CategoryTranslation = apps.get_model("blog", "CategoryTranslation")
    TagTranslation = apps.get_model("blog", "TagTranslation")
    PostTranslation = apps.get_model("blog", "PostTranslation")

    connection = schema_editor.connection

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, legacy_name, legacy_slug, legacy_description FROM blog_category"
        )
        for category_id, name, slug, description in cursor.fetchall():
            name = name or ""
            slug = slug or slugify_localized(name, language_code) or "categoria"
            CategoryTranslation.objects.update_or_create(
                master_id=category_id,
                language_code=language_code,
                defaults={
                    "name": name,
                    "slug": slug,
                    "description": description or "",
                },
            )

    existing_tag_slugs: set[str] = set(
        TagTranslation.objects.filter(language_code=language_code).values_list("slug", flat=True)
    )
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, legacy_name FROM blog_tag")
        for tag_id, name in cursor.fetchall():
            name = name or ""
            slug = _unique_slug(name, language_code, existing_tag_slugs, "etiqueta")
            TagTranslation.objects.update_or_create(
                master_id=tag_id,
                language_code=language_code,
                defaults={
                    "name": name,
                    "slug": slug,
                },
            )

    existing_post_slugs: set[str] = set(
        PostTranslation.objects.filter(language_code=language_code).values_list("slug", flat=True)
    )
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, legacy_title, legacy_slug, legacy_excerpt, legacy_content FROM blog_post"
        )
        for post_id, title, slug, excerpt, content in cursor.fetchall():
            title = title or ""
            base_slug = slug or slugify_localized(title, language_code) or "post"
            candidate = base_slug
            suffix = 1
            while candidate in existing_post_slugs:
                suffix += 1
                candidate = f"{base_slug}-{suffix}"
            existing_post_slugs.add(candidate)
            PostTranslation.objects.update_or_create(
                master_id=post_id,
                language_code=language_code,
                defaults={
                    "title": title,
                    "slug": candidate,
                    "excerpt": excerpt or "",
                    "content": content or "",
                },
            )


def _restore_default_language(apps, schema_editor) -> None:
    language_code = settings.LANGUAGE_CODE

    CategoryTranslation = apps.get_model("blog", "CategoryTranslation")
    TagTranslation = apps.get_model("blog", "TagTranslation")
    PostTranslation = apps.get_model("blog", "PostTranslation")

    connection = schema_editor.connection

    with connection.cursor() as cursor:
        for translation in CategoryTranslation.objects.filter(language_code=language_code):
            cursor.execute(
                "UPDATE blog_category SET legacy_name=%s, legacy_slug=%s, legacy_description=%s WHERE id=%s",
                [translation.name, translation.slug, translation.description, translation.master_id],
            )

    with connection.cursor() as cursor:
        for translation in TagTranslation.objects.filter(language_code=language_code):
            cursor.execute(
                "UPDATE blog_tag SET legacy_name=%s WHERE id=%s",
                [translation.name, translation.master_id],
            )

    with connection.cursor() as cursor:
        for translation in PostTranslation.objects.filter(language_code=language_code):
            cursor.execute(
                "UPDATE blog_post SET legacy_title=%s, legacy_slug=%s, legacy_excerpt=%s, legacy_content=%s WHERE id=%s",
                [
                    translation.title,
                    translation.slug,
                    translation.excerpt,
                    translation.content,
                    translation.master_id,
                ],
            )


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0005_parler_schema"),
    ]

    operations = [
        migrations.RunPython(_copy_default_language, _restore_default_language),
        migrations.RemoveField(model_name="category", name="legacy_name"),
        migrations.RemoveField(model_name="category", name="legacy_slug"),
        migrations.RemoveField(model_name="category", name="legacy_description"),
        migrations.RemoveField(model_name="tag", name="legacy_name"),
        migrations.RemoveField(model_name="post", name="legacy_title"),
        migrations.RemoveField(model_name="post", name="legacy_slug"),
        migrations.RemoveField(model_name="post", name="legacy_excerpt"),
        migrations.RemoveField(model_name="post", name="legacy_content"),
    ]
