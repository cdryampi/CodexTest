"""Helpers to interact with the OpenAI Responses API."""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

import requests
from django.conf import settings

try:  # pragma: no cover - defensive fallback when settings import changes
    from backend.backendblog.settings import (
        OPENAI_API_KEY as DEFAULT_OPENAI_API_KEY,
        OPEN_IA_KEY as DEFAULT_OPEN_IA_KEY,
    )
except ImportError:  # pragma: no cover - during setup the project settings are always available
    DEFAULT_OPENAI_API_KEY = ""
    DEFAULT_OPEN_IA_KEY = ""

logger = logging.getLogger(__name__)

DEFAULT_OPENAI_URL = "https://api.openai.com/v1/responses"
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_SYSTEM_PROMPT = (
    "Eres un asistente de traducción para un blog técnico. Conserva el formato "
    "Markdown o HTML cuando se solicite, respeta enlaces y código, y si se "
    "pide texto plano elimina cualquier marca o etiqueta. No inventes contenido."
)


class OpenAIConfigurationError(RuntimeError):
    """Raised when OpenAI integration is not properly configured."""


class OpenAIRequestError(RuntimeError):
    """Raised when OpenAI responds with an error or cannot be reached."""

    def __init__(self, message: str, *, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


def _clean_candidate(candidate: Optional[str]) -> str:
    if not isinstance(candidate, str):
        return ""
    value = candidate.strip().strip("'\"")
    return value.strip()


def _api_key() -> str:
    candidates = [
        os.getenv("OPENAI_API_KEY"),
        os.getenv("OPEN_IA_KEY"),
        os.getenv("DJANGO_OPENAI_API_KEY"),
        os.getenv("DJANGO_OPEN_IA_KEY"),
        getattr(settings, "OPENAI_API_KEY", None),
        getattr(settings, "OPEN_IA_KEY", None),
        DEFAULT_OPENAI_API_KEY,
        DEFAULT_OPEN_IA_KEY,
    ]

    for candidate in candidates:
        value = _clean_candidate(candidate)
        if value:
            return value

    return ""


def is_configured() -> bool:
    """Return ``True`` when the OpenAI integration can be used."""

    return bool(_api_key())


def _settings_value(name: str, default):
    return getattr(settings, name, default) or default


def _normalize_lang(value: Optional[str]) -> str:
    if not value:
        return ""
    return value.strip().lower()


def _format_instruction(fmt: str) -> str:
    normalized = (fmt or "").strip().lower()
    if normalized == "plain":
        return (
            "Formato de salida: texto plano sin etiquetas ni Markdown."
        )
    if normalized == "html":
        return (
            "Formato a conservar: HTML (usa equivalentes en Markdown cuando sea necesario)."
        )
    return "Formato a conservar: Markdown."


def _build_prompt(*, text: str, target_language: str, source_language: Optional[str], fmt: str) -> str:
    detected_source = _normalize_lang(source_language) or "origen detectado automáticamente"
    normalized_target = _normalize_lang(target_language) or "es"

    return "\n".join(
        [
            f"Idioma origen: {detected_source}.",
            f"Idioma destino: {normalized_target}.",
            _format_instruction(fmt),
            "Traduce el siguiente contenido sin añadir comentarios ni notas adicionales.",
            "Devuelve únicamente el texto traducido sin comillas ni observaciones.",
            "Texto:",
            text,
        ]
    )


def _text_format(fmt: Optional[str]) -> Dict[str, str]:
    """Return the OpenAI text format payload."""

    normalized = (fmt or "").strip().lower()
    if normalized in {"json", "json_object"}:
        return {"type": "json_object"}
    return {"type": "text"}


def _extract_translation(payload: Dict[str, Any]) -> str:
    if not isinstance(payload, dict):
        return ""

    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    output_blocks = payload.get("output")
    if isinstance(output_blocks, list):
        for block in output_blocks:
            contents = block.get("content") if isinstance(block, dict) else None
            if not isinstance(contents, list):
                continue
            for item in contents:
                text = item.get("text") if isinstance(item, dict) else None
                if isinstance(text, str) and text.strip():
                    return text.strip()

    choices = payload.get("choices")
    if isinstance(choices, list) and choices:
        message = choices[0]
        if isinstance(message, dict):
            text_value = message.get("message", {}).get("content")
            if isinstance(text_value, str) and text_value.strip():
                return text_value.strip()

    return ""


def translate_text(
    *,
    text: str,
    target_language: str,
    source_language: Optional[str] = None,
    fmt: str = "markdown",
    temperature: float = 0.2,
) -> str:
    """Translate ``text`` into ``target_language`` using the OpenAI API."""

    if not is_configured():
        raise OpenAIConfigurationError(
            "Configura OPEN_IA_KEY en el entorno del backend para habilitar las traducciones."
        )

    api_key = _api_key()
    url = _settings_value("OPENAI_API_URL", DEFAULT_OPENAI_URL)
    model = _settings_value("OPENAI_DEFAULT_MODEL", DEFAULT_MODEL)
    system_prompt = _settings_value("OPENAI_SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT)
    timeout = _settings_value("OPENAI_REQUEST_TIMEOUT", 15.0)

    payload = {
        "model": model,
        "temperature": temperature,
        "instructions": system_prompt,
        "input": _build_prompt(
            text=text,
            target_language=target_language,
            source_language=source_language,
            fmt=fmt,
        ),
        "text": {"format": _text_format(fmt)},
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
    except requests.RequestException as exc:  # pragma: no cover - network failure
        logger.exception("Error contacting OpenAI: %s", exc)
        raise OpenAIRequestError(
            "No fue posible contactar el servicio de OpenAI. Inténtalo de nuevo más tarde."
        ) from exc

    if response.status_code >= 400:
        detail = "OpenAI no pudo procesar la solicitud de traducción."
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = None
        if isinstance(error_payload, dict):
            message = error_payload.get("error", {}).get("message")
            if isinstance(message, str) and message.strip():
                detail = message.strip()
        logger.warning(
            "OpenAI request failed with status %s: %s", response.status_code, detail
        )
        raise OpenAIRequestError(detail, status_code=response.status_code)

    try:
        data = response.json()
    except ValueError as exc:
        logger.exception("Invalid JSON payload from OpenAI: %s", exc)
        raise OpenAIRequestError(
            "OpenAI devolvió una respuesta inválida. Inténtalo más tarde."
        ) from exc

    translation = _extract_translation(data)
    if not translation:
        logger.warning("OpenAI response did not include a translation: %s", data)
        raise OpenAIRequestError(
            "El servicio de OpenAI no devolvió un resultado de traducción válido."
        )

    return translation
