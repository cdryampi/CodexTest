"""Internationalization helpers for the blog backend."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator, Optional

from django.conf import settings
from django.utils import translation
from slugify import slugify


def _supported_language_codes() -> set[str]:
    return {code for code, _name in getattr(settings, "LANGUAGES", ())}


def _clean_language_code(language_code: Optional[str]) -> str:
    supported = _supported_language_codes()
    if language_code and language_code in supported:
        return language_code
    return settings.LANGUAGE_CODE


def get_active_language(request) -> str:
    """Resolve the active language for a request."""

    supported = _supported_language_codes()
    if request is not None:
        lang_from_query: Optional[str] = None
        if hasattr(request, "query_params"):
            lang_from_query = request.query_params.get("lang")
        elif hasattr(request, "GET"):
            lang_from_query = request.GET.get("lang")
        if lang_from_query:
            lang_from_query = lang_from_query.strip()
            if lang_from_query in supported:
                return lang_from_query

        content_language = None
        if hasattr(request, "headers"):
            content_language = request.headers.get("Content-Language")
        elif hasattr(request, "META"):
            content_language = request.META.get("HTTP_CONTENT_LANGUAGE")
        if content_language:
            content_language = content_language.strip()
            if content_language in supported:
                return content_language
            normalized = content_language.split("-", 1)[0]
            if normalized in supported:
                return normalized

        negotiated = translation.get_language_from_request(request, check_path=False)
        if negotiated in supported:
            return negotiated

    return settings.LANGUAGE_CODE


@contextmanager
def set_parler_language(language_code: Optional[str]) -> Iterator[None]:
    """Context manager to activate a language for django-parler operations."""

    active_code = _clean_language_code(language_code)
    try:
        from parler.utils.context import smart_override  # type: ignore
    except ImportError:  # pragma: no cover - parler should be installed
        with translation.override(active_code):
            yield
    else:
        with smart_override(active_code):
            yield


def slugify_localized(text: str, language_code: Optional[str] = None) -> str:
    """Generate slugs using the configured language rules."""

    if not text:
        return ""
    active_code = _clean_language_code(language_code)
    return slugify(text, lowercase=True)
