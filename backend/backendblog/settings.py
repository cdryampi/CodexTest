"""Django settings for backendblog project."""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent.parent

def _env(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value is None:
        return default
    value = value.strip()
    return value if value else default


def _env_bool(key: str, default: bool = False) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(key: str) -> list[str]:
    raw = os.getenv(key, "")
    return [item.strip() for item in raw.split(",") if item.strip()]


SECRET_KEY = _env("SECRET_KEY", "unsafe-secret-key")
DEBUG = _env_bool("DEBUG", False)

_default_allowed_hosts = ["backendblog.yampi.eu", "localhost", "127.0.0.1"]
_extra_allowed_hosts = _env_csv("ALLOWED_HOSTS")
ALLOWED_HOSTS = list(dict.fromkeys(_default_allowed_hosts + _extra_allowed_hosts))

INSTALLED_APPS = [
    "jazzmin",
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "blog.apps.BlogConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backendblog.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backendblog.wsgi.application"

_DATABASE_URL = _env("DATABASE_URL")
if _DATABASE_URL:
    parsed = urlparse(_DATABASE_URL)
    DATABASES: Dict[str, Dict[str, object]] = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/") or "postgres",
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "",
            "PORT": str(parsed.port or ""),
        }
    }
    query = parse_qs(parsed.query)
    if query:
        DATABASES["default"]["OPTIONS"] = {key: values[-1] for key, values in query.items() if values}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _env("POSTGRES_DB", "postgres"),
            "USER": _env("POSTGRES_USER", "postgres"),
            "PASSWORD": _env("POSTGRES_PASSWORD", "postgres"),
            "HOST": _env("POSTGRES_HOST", "postgres"),
            "PORT": str(_env("POSTGRES_PORT", "5432")),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
TIME_ZONE = "Europe/Madrid"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

_static_dir = BASE_DIR / "static"
if _static_dir.exists():
    STATICFILES_DIRS = [_static_dir]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SECURE_SSL_REDIRECT = _env_bool("SECURE_SSL_REDIRECT", not DEBUG)
if SECURE_SSL_REDIRECT:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(_env_csv("CSRF_TRUSTED_ORIGINS")))

# Orígenes permitidos por defecto para servir el frontend público de CodexTest
_default_cors_origins = [
    "https://cdryampi.github.io",
    "https://cdryampi.github.io/CodexTest/",
    "https://codextest-front.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

_default_cors_origin_regexes = [
    r"^https://codextest-front(?:-[\w-]+)?\.vercel\.app/?$",
]

_raw_cors_origins = _env_csv("CORS_ALLOWED_ORIGINS")
if _raw_cors_origins:
    _raw_cors_origins.extend(_default_cors_origins)
else:
    _raw_cors_origins = list(_default_cors_origins)
CORS_ALLOWED_ORIGINS: list[str] = []
CORS_ALLOWED_ORIGIN_REGEXES: list[str] = list(_default_cors_origin_regexes)
for origin in _raw_cors_origins:
    origin = origin.strip()
    if not origin:
        continue
    parsed_origin = urlparse(origin)
    if parsed_origin.path and parsed_origin.path not in {"", "/"}:
        base_origin = f"{parsed_origin.scheme}://{parsed_origin.netloc}" if parsed_origin.netloc else ""
        if base_origin:
            CORS_ALLOWED_ORIGINS.append(base_origin.rstrip("/"))
        escaped = re.escape(origin.rstrip("/"))
        CORS_ALLOWED_ORIGIN_REGEXES.append(rf"^{escaped}/?$")
    else:
        CORS_ALLOWED_ORIGINS.append(origin.rstrip("/"))

CORS_ALLOWED_ORIGINS = list(dict.fromkeys(CORS_ALLOWED_ORIGINS))
CORS_ALLOWED_ORIGIN_REGEXES = list(dict.fromkeys(CORS_ALLOWED_ORIGIN_REGEXES))

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "blog.pagination.DefaultPageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
}

SPECTACULAR_SETTINGS = {
    "TITLE": "CodexTest Blog API",
    "DESCRIPTION": "API pública para entradas y comentarios del blog de CodexTest.",
    "VERSION": "1.0.0",
    "SERVERS": [
        {"url": "https://backendblog.yampi.eu", "description": "Producción"},
        {"url": "http://127.0.0.1:8000", "description": "Local"},
    ],
}

JAZZMIN_SETTINGS = {
    "site_title": "BackendBlog Admin",
    "site_header": "BackendBlog",
    "site_brand": "BackendBlog",
    "welcome_sign": "Bienvenido al panel de BackendBlog",
}
