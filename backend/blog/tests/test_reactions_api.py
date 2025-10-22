from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings
from rest_framework.test import APITestCase

from blog.models import Post, Reaction


class PostReactionsAPITestCase(APITestCase):
    """Validate the public and authenticated behaviour of reactions endpoints."""

    def setUp(self):
        super().setUp()
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="reactionist",
            email="reactionist@example.com",
            password="safe-password-123",
        )
        self.other_user = user_model.objects.create_user(
            username="second", email="second@example.com", password="safe-password-123"
        )
        self.post = Post.objects.create(
            title="Entrada con reacciones",
            excerpt="Resumen",
            content="Contenido extendido" * 3,
            image="https://example.com/image.png",
            thumb="https://example.com/thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
            status=Post.Status.PUBLISHED,
        )

    def reactions_url(self) -> str:
        return reverse("blog:posts-reactions", kwargs={"slug": self.post.slug})

    def react_url(self) -> str:
        return reverse("blog:posts-react", kwargs={"slug": self.post.slug})

    def test_public_summary_returns_counts_and_total(self):
        """Anyone can consult the aggregated summary of reactions for a post."""

        Reaction.objects.create(
            user=self.other_user,
            content_object=self.post,
            type=Reaction.Types.LOVE,
        )

        response = self.client.get(self.reactions_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("counts", response.data)
        self.assertEqual(response.data["counts"][Reaction.Types.LOVE], 1)
        self.assertEqual(response.data["total"], 1)
        self.assertIsNone(response.data.get("my_reaction"))

    def test_react_requires_authentication(self):
        """Toggling a reaction without authentication returns HTTP 401."""

        response = self.client.post(
            self.react_url(),
            {"type": Reaction.Types.LIKE},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Reaction.objects.count(), 0)

    def test_toggle_creates_replaces_and_removes(self):
        """Authenticated users can create, replace and remove their reactions."""

        self.client.force_authenticate(self.user)

        created = self.client.post(
            self.react_url(),
            {"type": Reaction.Types.LIKE},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_200_OK)
        self.assertEqual(created.data["my_reaction"], Reaction.Types.LIKE)
        self.assertEqual(created.data["counts"][Reaction.Types.LIKE], 1)
        self.assertEqual(created.data["total"], 1)

        replaced = self.client.post(
            self.react_url(),
            {"type": Reaction.Types.WOW},
            format="json",
        )
        self.assertEqual(replaced.status_code, status.HTTP_200_OK)
        self.assertEqual(replaced.data["my_reaction"], Reaction.Types.WOW)
        self.assertEqual(replaced.data["counts"][Reaction.Types.WOW], 1)
        self.assertEqual(replaced.data["counts"][Reaction.Types.LIKE], 0)
        self.assertEqual(replaced.data["total"], 1)

        removed = self.client.post(
            self.react_url(),
            {"type": Reaction.Types.WOW},
            format="json",
        )
        self.assertEqual(removed.status_code, status.HTTP_200_OK)
        self.assertIsNone(removed.data["my_reaction"])
        self.assertEqual(removed.data["counts"][Reaction.Types.WOW], 0)
        self.assertEqual(removed.data["total"], 0)

    def test_reactions_are_throttled(self):
        """Posting reactions honours the dedicated throttle scope."""

        original_rates = dict(api_settings.DEFAULT_THROTTLE_RATES)
        api_settings.DEFAULT_THROTTLE_RATES["reactions"] = "2/min"
        api_settings.reload()
        cache.clear()

        try:
            self.client.force_authenticate(self.user)
            first = self.client.post(
                self.react_url(),
                {"type": Reaction.Types.LIKE},
                format="json",
            )
            self.assertEqual(first.status_code, status.HTTP_200_OK)

            second = self.client.post(
                self.react_url(),
                {"type": Reaction.Types.LOVE},
                format="json",
            )
            self.assertEqual(second.status_code, status.HTTP_200_OK)

            third = self.client.post(
                self.react_url(),
                {"type": Reaction.Types.CLAP},
                format="json",
            )
            self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            cache.clear()
            api_settings.DEFAULT_THROTTLE_RATES.clear()
            api_settings.DEFAULT_THROTTLE_RATES.update(original_rates)
            api_settings.reload()
