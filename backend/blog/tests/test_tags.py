from __future__ import annotations

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import Post, Tag


class TagAPITestCase(APITestCase):
    """Validate the CRUD capabilities of the tag endpoints."""

    def setUp(self) -> None:
        self.list_url = reverse("blog:tags-list")
        self.user = get_user_model().objects.create_user(
            username="editor",
            email="editor@example.com",
            password="strong-pass-123",
        )

    def test_create_and_list_tags_with_counts(self) -> None:
        """Authenticated users can create tags and list them with counters."""

        self.client.force_authenticate(self.user)
        payload = {"name": "Backend"}

        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_slug = response.data["slug"]
        tag = Tag.objects.get(slug=created_slug)

        post = Post.objects.create(
            title="Backend sólido",
            excerpt="Resumen",
            content="Contenido" * 3,
            image="https://example.com/post.png",
            thumb="https://example.com/post-thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
        )
        post.tags.add(tag)

        list_response = self.client.get(self.list_url, {"with_counts": "true"})
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        results = list_response.data["results"]
        self.assertGreaterEqual(len(results), 1)

        payload = next(item for item in results if item["slug"] == tag.slug)
        self.assertIn("post_count", payload)
        self.assertGreaterEqual(payload["post_count"], 1)

    def test_search_tags_by_name(self) -> None:
        """Tags can be filtered by their name using the `q` parameter."""

        Tag.objects.create(name="Python")
        Tag.objects.create(name="DevOps")

        response = self.client.get(self.list_url, {"q": "python"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"].lower(), "python")
