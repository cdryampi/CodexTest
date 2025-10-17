"""API tests for the blog application."""
from __future__ import annotations

from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Post, Tag


class PostAPITestCase(APITestCase):
    """Validate the main behaviours of the public post API."""

    def setUp(self) -> None:
        self.list_url = reverse("post-list")

    def test_list_returns_existing_post(self) -> None:
        """The list endpoint must return the stored posts with their tags."""

        tag = Tag.objects.create(name="Django")
        post = Post.objects.create(
            title="Hola mundo",
            excerpt="Resumen del post",
            content="Contenido detallado",
            date=date(2024, 1, 1),
            image="https://example.com/image.png",
            thumb="https://example.com/thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
        )
        post.tags.add(tag)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        self.assertEqual(payload["count"], 1)
        result = payload["results"][0]
        self.assertEqual(result["title"], post.title)
        self.assertEqual(result["slug"], post.slug)
        self.assertEqual(result["tags"], [tag.name])

    def test_create_post_creates_missing_tags(self) -> None:
        """Creating a post via the API should reuse and create tags by name."""

        Tag.objects.create(name="Backend")

        payload = {
            "title": "Nuevo post",
            "excerpt": "Extracto",
            "content": "Contenido",
            "date": "2024-02-01",
            "image": "https://example.com/new.png",
            "thumb": "https://example.com/new-thumb.png",
            "imageAlt": "Otra imagen",
            "author": "Equipo",
            "tags": ["Backend", "APIs"],
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data
        self.assertTrue(Tag.objects.filter(name="APIs").exists())

        post = Post.objects.get(slug=data["slug"])
        self.assertEqual(post.title, payload["title"])
        self.assertSetEqual(
            set(post.tags.values_list("name", flat=True)),
            {"Backend", "APIs"},
        )
