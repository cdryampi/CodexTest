from __future__ import annotations

from django.core.cache import cache
from rest_framework.settings import api_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import Post, Reaction
from blog.views import ReactionsRateThrottle


class ReactionAPITestCase(APITestCase):
    """Validate the reaction toggle endpoint for posts."""

    def setUp(self):
        super().setUp()
        self.user = get_user_model().objects.create_user(
            username="reacter",
            email="react@example.com",
            password="safe-password-123",
        )
        self.other = get_user_model().objects.create_user(
            username="second",
            email="second@example.com",
            password="safe-password-123",
        )
        self.post = Post.objects.create(
            title="Entrada con reacciones",
            excerpt="Resumen",
            content="Contenido extendido" * 3,
            image="https://example.com/image.png",
            thumb="https://example.com/thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
        )
        self.url = reverse("blog:posts-reactions", kwargs={"slug": self.post.slug})

    def test_user_can_create_and_remove_reaction(self):
        """Toggling the same reaction twice removes it and updates the summary."""

        self.client.force_authenticate(self.user)

        create_response = self.client.post(self.url, {"type": Reaction.Types.LIKE}, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_200_OK)
        self.assertEqual(create_response.data["my_reaction"], Reaction.Types.LIKE)
        self.assertEqual(create_response.data["counts"][Reaction.Types.LIKE], 1)
        self.assertEqual(create_response.data["total"], 1)

        remove_response = self.client.post(self.url, {"type": Reaction.Types.LIKE}, format="json")
        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        self.assertIsNone(remove_response.data["my_reaction"])
        self.assertEqual(remove_response.data["counts"][Reaction.Types.LIKE], 0)
        self.assertEqual(remove_response.data["total"], 0)

    def test_user_can_replace_reaction_type(self):
        """Posting a different type replaces the previous reaction for the user."""

        self.client.force_authenticate(self.user)
        self.client.post(self.url, {"type": Reaction.Types.LIKE}, format="json")

        replace_response = self.client.post(self.url, {"type": Reaction.Types.LOVE}, format="json")
        self.assertEqual(replace_response.status_code, status.HTTP_200_OK)
        self.assertEqual(replace_response.data["my_reaction"], Reaction.Types.LOVE)
        self.assertEqual(replace_response.data["counts"][Reaction.Types.LOVE], 1)
        self.assertEqual(replace_response.data["counts"][Reaction.Types.LIKE], 0)
        self.assertEqual(replace_response.data["total"], 1)

    def test_summary_includes_counts_and_my_reaction(self):
        """Summary includes aggregate counts and the current user's reaction."""

        Reaction.objects.create(user=self.other, content_object=self.post, type=Reaction.Types.CLAP)

        self.client.force_authenticate(self.user)
        self.client.post(self.url, {"type": Reaction.Types.WOW}, format="json")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["counts"][Reaction.Types.CLAP], 1)
        self.assertEqual(response.data["counts"][Reaction.Types.WOW], 1)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["my_reaction"], Reaction.Types.WOW)

        self.client.logout()
        anonymous_response = self.client.get(self.url)
        self.assertEqual(anonymous_response.status_code, status.HTTP_200_OK)
        self.assertIsNone(anonymous_response.data.get("my_reaction"))

    def test_toggle_requires_authentication(self):
        """Unauthenticated users cannot toggle reactions."""

        response = self.client.post(self.url, {"type": Reaction.Types.LIKE}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Reaction.objects.count(), 0)

    def test_reaction_toggle_is_throttled(self):
        """The toggle endpoint honours the reactions throttle scope."""

        original_rate = api_settings.DEFAULT_THROTTLE_RATES.get("reactions")
        api_settings.DEFAULT_THROTTLE_RATES["reactions"] = "2/min"
        api_settings.reload()
        cache.clear()

        try:
            self.assertEqual(
                ReactionsRateThrottle().get_rate(),
                "2/min",
            )
            self.client.force_authenticate(self.user)
            first = self.client.post(self.url, {"type": Reaction.Types.LIKE}, format="json")
            self.assertEqual(first.status_code, status.HTTP_200_OK)
            second = self.client.post(self.url, {"type": Reaction.Types.LOVE}, format="json")
            self.assertEqual(second.status_code, status.HTTP_200_OK)
            third = self.client.post(self.url, {"type": Reaction.Types.CLAP}, format="json")
            self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            if original_rate is None:
                api_settings.DEFAULT_THROTTLE_RATES.pop("reactions", None)
            else:
                api_settings.DEFAULT_THROTTLE_RATES["reactions"] = original_rate
            api_settings.reload()
