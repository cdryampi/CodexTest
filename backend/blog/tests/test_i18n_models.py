from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from parler.utils.context import switch_language

from blog.models import Category, Post, Tag


class I18nModelsTestCase(TestCase):
    def setUp(self) -> None:
        self.image_url = "https://example.com/image.jpg"
        self.thumb_url = "https://example.com/thumb.jpg"

    def _create_post(self, title: str = "Entrada ES") -> Post:
        return Post.objects.create(
            title=title,
            excerpt="Resumen base",
            content="Contenido base",
            image=self.image_url,
            thumb=self.thumb_url,
            imageAlt="Alt",
            author="Autor",
        )

    def test_post_translation_roundtrip(self) -> None:
        post = self._create_post()
        with switch_language(post, "en"):
            post.title = "Entry EN"
            post.excerpt = "Summary EN"
            post.content = "Content EN"
            post.slug = ""
            post.save()

        es_slug = post.safe_translation_getter("slug", language_code=settings.LANGUAGE_CODE)
        en_slug = post.safe_translation_getter("slug", language_code="en")
        self.assertNotEqual(es_slug, en_slug)

        retrieved = Post.objects.language("en").get(slug=en_slug)
        self.assertEqual(retrieved.safe_translation_getter("title", language_code="en"), "Entry EN")
        self.assertEqual(
            retrieved.safe_translation_getter("excerpt", language_code="en"),
            "Summary EN",
        )
        self.assertEqual(
            retrieved.safe_translation_getter("content", language_code="en"),
            "Content EN",
        )

    def test_slug_uniqueness_per_language(self) -> None:
        base_tag = Tag.objects.create(name="Python")
        duplicate_tag = Tag(name="Duplicado")
        duplicate_tag.slug = base_tag.slug
        with self.assertRaisesMessage(ValidationError, "ya existe para el idioma"):
            duplicate_tag.full_clean()

        with switch_language(base_tag, "en"):
            base_tag.name = "Python"
            base_tag.slug = "python"
            base_tag.save()

        allowed = Tag.objects.create(name="Permitido")
        with switch_language(allowed, "en"):
            allowed.name = "Allowed"
            allowed.slug = base_tag.safe_translation_getter("slug", language_code=settings.LANGUAGE_CODE)
            allowed.full_clean()
            allowed.save()

        with switch_language(allowed, "en"):
            allowed.slug = "python"
            with self.assertRaisesMessage(ValidationError, "ya existe para el idioma"):
                allowed.full_clean()

    def test_manager_resolves_translated_fields(self) -> None:
        category = Category.objects.create(name="Backend", description="Servicios")
        Category.objects.create(name="Frontend", description="Interfaces")

        found = Category.objects.filter(name="Backend").first()
        self.assertEqual(found.pk, category.pk)

        other = Category.objects.filter(description__icontains="inter").first()
        self.assertIsNotNone(other)


class AdminI18nTestCase(TestCase):
    def setUp(self) -> None:
        User = get_user_model()
        self.superuser = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="pass1234"
        )
        self.client.force_login(self.superuser)

    def test_admin_forms_render_language_tabs(self) -> None:
        response = self.client.get(reverse("admin:blog_post_add"))
        self.assertContains(response, "language-tabs")
        self.assertContains(response, "language_button")
