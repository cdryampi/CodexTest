"""Tests covering category API behaviours."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import Category, Post, Tag


class CategoryAPITestCase(APITestCase):
    """Ensure categories can be created, listed and used as filters."""

    def setUp(self) -> None:
        self.list_url = reverse("blog:categories-list")
        self.user = get_user_model().objects.create_user(
            username="tester",
            email="tester@example.com",
            password="strong-pass-123",
        )

    def test_create_and_list_categories(self) -> None:
        """Authenticated users can create categories and list them with counts."""

        self.client.force_authenticate(self.user)
        payload = {
            "name": "Frontend",
            "description": "Todo sobre interfaces y experiencia de usuario",
            "is_active": True,
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_slug = response.data["slug"]
        self.assertTrue(Category.objects.filter(slug=created_slug).exists())

        Post.objects.create(
            title="Artículo de prueba",
            excerpt="Resumen",
            content="Contenido extenso" * 3,
            image="https://example.com/image.png",
            thumb="https://example.com/thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
        ).categories.add(Category.objects.get(slug=created_slug))

        list_response = self.client.get(self.list_url, {"with_counts": "true"})

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(list_response.data["count"], 1)
        payload = list_response.data["results"][0]
        self.assertIn("post_count", payload)
        self.assertGreaterEqual(payload["post_count"], 1)

    def test_filter_posts_by_category(self) -> None:
        """Listing posts can be restricted to a chosen category slug."""

        frontend = Category.objects.create(name="Frontend")
        backend = Category.objects.create(name="Backend")
        post_a = Post.objects.create(
            title="Frontend feliz",
            excerpt="Resumen",
            content="Contenido" * 3,
            image="https://example.com/a.png",
            thumb="https://example.com/a-thumb.png",
            imageAlt="Alt",
            author="Codex",
        )
        post_b = Post.objects.create(
            title="Backend sólido",
            excerpt="Resumen",
            content="Contenido" * 3,
            image="https://example.com/b.png",
            thumb="https://example.com/b-thumb.png",
            imageAlt="Alt",
            author="Codex",
        )
        post_a.categories.add(frontend)
        post_b.categories.add(backend)

        response = self.client.get(reverse("blog:posts-list"), {"category": frontend.slug})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["slug"], post_a.slug)

    def test_create_post_with_categories(self) -> None:
        """The post endpoint accepts category slugs on creation."""

        self.client.force_authenticate(self.user)
        content_category = Category.objects.create(name="Contenido")
        testing_category = Category.objects.create(name="Testing")
        tag = Tag.objects.create(name="python")

        payload = {
            "title": "Nuevo post con categorías",
            "excerpt": "Resumen",
            "content": "Contenido " * 10,
            "tags": [tag.name],
            "categories": [content_category.slug, testing_category.slug],
            "image": "https://example.com/img.png",
            "thumb": "https://example.com/thumb.png",
            "imageAlt": "Alt",
            "author": "Codex",
        }

        response = self.client.post(reverse("blog:posts-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post_slug = response.data["slug"]
        post = Post.objects.get(slug=post_slug)
        self.assertEqual(post.categories.count(), 2)
        self.assertSetEqual(
            set(post.categories.values_list("slug", flat=True)),
            {content_category.slug, testing_category.slug},
        )


class CategoryModelTestCase(TestCase):
    """Validate category slug generation without hitting the API."""

    def test_slug_autoincrements_for_similar_names(self) -> None:
        """Categories sharing a slug base should get incremental suffixes."""

        first = Category.objects.create(name="Data Science")
        second = Category.objects.create(name="Data Science!!")

        self.assertEqual(first.slug, "data-science")
        self.assertEqual(second.slug, "data-science-2")
