"""Django settings for backendblog project."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Dict
from urllib.parse import parse_qs, urlparse

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET", default="unsafe-secret-key")
DEBUG = config("DJANGO_DEBUG", cast=bool, default=False)

_default_allowed_hosts = ["backendblog.yampi.eu", "localhost", "127.0.0.1"]
_extra_allowed_hosts = [host for host in config("DJANGO_ALLOWED_HOSTS", default="", cast=Csv()) if host]
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
    "blog",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
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

_DATABASE_URL = config("DATABASE_URL", default=None)
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
            "NAME": config("POSTGRES_DB", default="postgres"),
            "USER": config("POSTGRES_USER", default="postgres"),
            "PASSWORD": config("POSTGRES_PASSWORD", default="postgres"),
            "HOST": config("POSTGRES_HOST", default="postgres"),
            "PORT": str(config("POSTGRES_PORT", default=5432, cast=int)),
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

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SECURE_SSL_REDIRECT = config("DJANGO_SECURE_SSL_REDIRECT", cast=bool, default=not DEBUG)
if SECURE_SSL_REDIRECT:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_TRUSTED_ORIGINS = list(
    dict.fromkeys(
        config(
            "DJANGO_CSRF_TRUSTED_ORIGINS",
            default="https://backendblog.yampi.eu,https://cdryampi.github.io",
            cast=Csv(),
        )
    )
)

_raw_cors_origins = config(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    default="https://cdryampi.github.io/CodexTest/",
    cast=Csv(),
)
CORS_ALLOWED_ORIGINS: list[str] = []
CORS_ALLOWED_ORIGIN_REGEXES: list[str] = []
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
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
}

JAZZMIN_SETTINGS = {
    "site_title": "BackendBlog Admin",
    "site_header": "BackendBlog",
    "site_brand": "BackendBlog",
    "welcome_sign": "Bienvenido al panel de BackendBlog",
}
