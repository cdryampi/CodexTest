"""Integration tests for the OpenAI translation endpoint."""
from __future__ import annotations

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from blog.utils.openai import OpenAIConfigurationError, OpenAIRequestError


class OpenAITranslationAPITests(APITestCase):
    """Ensure the API endpoint proxies requests to OpenAI correctly."""

    def setUp(self) -> None:
        self.url = reverse("blog:ai-translations-list")
        self.user = get_user_model().objects.create_user(
            username="translator",
            email="translator@example.com",
            password="secure-pass-123",
        )
        self.payload = {
            "text": "Hola mundo",
            "target_lang": "EN",
            "source_lang": "ES",
            "format": "Markdown",
        }

    def test_requires_authentication(self) -> None:
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(OPENAI_API_KEY="test-key")
    def test_returns_translation_when_backend_succeeds(self) -> None:
        self.client.force_authenticate(self.user)

        with patch("blog.views.translate_text", return_value="Hello world") as mock_translate:
            response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["translation"], "Hello world")
        mock_translate.assert_called_once_with(
            text="Hola mundo",
            target_language="en",
            source_language="es",
            fmt="markdown",
        )

    def test_handles_configuration_errors(self) -> None:
        self.client.force_authenticate(self.user)
        with patch(
            "blog.views.translate_text",
            side_effect=OpenAIConfigurationError("Configura la clave"),
        ):
            response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("Configura la clave", response.data["detail"])

    def test_propagates_openai_error_status(self) -> None:
        self.client.force_authenticate(self.user)
        with patch(
            "blog.views.translate_text",
            side_effect=OpenAIRequestError("Límite alcanzado", status_code=429),
        ):
            response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Límite alcanzado", response.data["detail"])

    def test_fallbacks_to_bad_gateway_when_status_missing(self) -> None:
        self.client.force_authenticate(self.user)
        with patch(
            "blog.views.translate_text",
            side_effect=OpenAIRequestError("Fallo temporal"),
        ):
            response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("Fallo temporal", response.data["detail"])
