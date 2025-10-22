"""Tests for the OpenAI utility helpers."""
from __future__ import annotations

import os
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from blog.utils import openai
from blog.utils.openai import (
    OpenAIConfigurationError,
    OpenAIRequestError,
    is_configured,
    translate_text,
)


class OpenAIUtilsTests(SimpleTestCase):
    """Validate the behaviour of the OpenAI integration helpers."""

    @override_settings(OPENAI_API_KEY="test-key")
    def test_is_configured_when_key_is_present(self) -> None:
        self.assertTrue(is_configured())

    @override_settings(OPENAI_API_KEY="", OPEN_IA_KEY="fallback-key")
    def test_is_configured_with_open_ia_key(self) -> None:
        self.assertTrue(is_configured())

    @override_settings(OPENAI_API_KEY="", OPEN_IA_KEY="")
    def test_is_configured_when_key_missing(self) -> None:
        with patch.dict(os.environ, {"VITE_OPEN_IA_KEY": ""}):
            self.assertFalse(is_configured())

    @override_settings(
        OPENAI_API_KEY="test-key",
        OPENAI_API_URL="https://api.openai.com/v1/responses",
        OPENAI_DEFAULT_MODEL="test-model",
        OPENAI_SYSTEM_PROMPT="prompt",
        OPENAI_REQUEST_TIMEOUT=5,
    )
    def test_translate_text_success(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"output_text": "Hello world"}

        with patch("blog.utils.openai.requests.post", return_value=mock_response) as mock_post:
            translation = translate_text(text="Hola mundo", target_language="en")

        self.assertEqual(translation, "Hello world")
        mock_post.assert_called_once()
        kwargs = mock_post.call_args.kwargs
        self.assertEqual(kwargs["json"]["model"], "test-model")
        self.assertIn("Hola mundo", kwargs["json"]["input"])
        self.assertEqual(
            kwargs["json"]["text"], {"format": {"type": "text"}}
        )
        self.assertIn("Formato a conservar: Markdown.", kwargs["json"]["input"])
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-key")

    @override_settings(OPENAI_API_KEY="test-key")
    def test_translate_text_uses_markdown_format_for_html(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"output_text": "<p>Hello world</p>"}

        with patch("blog.utils.openai.requests.post", return_value=mock_response) as mock_post:
            translate_text(text="<p>Hola</p>", target_language="en", fmt="html")

        kwargs = mock_post.call_args.kwargs
        self.assertEqual(
            kwargs["json"]["text"], {"format": {"type": "text"}}
        )
        self.assertIn("Formato a conservar: HTML", kwargs["json"]["input"])

    @override_settings(OPENAI_API_KEY="test-key")
    def test_translate_text_uses_plain_format(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"output_text": "Hello world"}

        with patch("blog.utils.openai.requests.post", return_value=mock_response) as mock_post:
            translate_text(text="Hola", target_language="en", fmt="plain")

        kwargs = mock_post.call_args.kwargs
        self.assertEqual(
            kwargs["json"]["text"], {"format": {"type": "text"}}
        )
        self.assertIn("Formato de salida: texto plano", kwargs["json"]["input"])

    @override_settings(
        OPENAI_API_KEY="",
        OPEN_IA_KEY="open-ia-key",
        OPENAI_API_URL="https://api.openai.com/v1/responses",
        OPENAI_DEFAULT_MODEL="test-model",
        OPENAI_SYSTEM_PROMPT="prompt",
        OPENAI_REQUEST_TIMEOUT=5,
    )
    def test_translate_text_uses_open_ia_key(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"output_text": "Hello world"}

        with patch("blog.utils.openai.requests.post", return_value=mock_response) as mock_post:
            translation = translate_text(text="Hola mundo", target_language="en")

        self.assertEqual(translation, "Hello world")
        mock_post.assert_called_once()
        kwargs = mock_post.call_args.kwargs
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer open-ia-key")

    @override_settings(OPENAI_API_KEY="", OPEN_IA_KEY="")
    def test_translate_text_requires_configuration(self) -> None:
        with patch.dict(os.environ, {"VITE_OPEN_IA_KEY": ""}):
            with self.assertRaises(OpenAIConfigurationError):
                translate_text(text="Hola", target_language="en")

    @override_settings(OPENAI_API_KEY="test-key")
    def test_translate_text_http_error(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": {"message": "Invalid key"}}

        with patch("blog.utils.openai.requests.post", return_value=mock_response):
            with self.assertRaises(OpenAIRequestError) as ctx:
                translate_text(text="Hola", target_language="en")

        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Invalid key", str(ctx.exception))

    @override_settings(OPENAI_API_KEY="test-key")
    def test_translate_text_invalid_json(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.side_effect = ValueError("invalid json")

        with patch("blog.utils.openai.requests.post", return_value=mock_response):
            with self.assertRaises(OpenAIRequestError):
                translate_text(text="Hola", target_language="en")

    @override_settings(OPENAI_API_KEY="test-key")
    def test_translate_text_missing_payload(self) -> None:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}

        with patch("blog.utils.openai.requests.post", return_value=mock_response):
            with self.assertRaises(OpenAIRequestError):
                translate_text(text="Hola", target_language="en")

    @override_settings(OPENAI_API_KEY="", OPEN_IA_KEY="")
    def test_api_key_strips_quotes_from_environment(self) -> None:
        with patch.dict(os.environ, {"OPEN_IA_KEY": "  'quoted-key'  "}):
            self.assertTrue(is_configured())
            self.assertEqual(openai._api_key(), "quoted-key")
