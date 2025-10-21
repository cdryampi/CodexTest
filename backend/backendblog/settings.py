"""Django settings for backendblog project."""
from __future__ import annotations

import os
import re
from datetime import timedelta
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


def _env_int(key: str, default: int) -> int:
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return int(value.strip())
    except (TypeError, ValueError):
        return default


def _env_float(key: str, default: float) -> float:
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return float(value.strip())
    except (TypeError, ValueError):
        return default


SECRET_KEY = _env("SECRET_KEY", "unsafe-secret-key")
DEBUG = _env_bool("DEBUG", False)

_default_allowed_hosts = ["backendblog.yampi.eu", "localhost", "127.0.0.1"]
_extra_allowed_hosts = _env_csv("ALLOWED_HOSTS")
ALLOWED_HOSTS = list(dict.fromkeys(_default_allowed_hosts + _extra_allowed_hosts))

SITE_ID = 1

INSTALLED_APPS = [
    "jazzmin",
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "drf_spectacular",
    "parler",
    "parler_rest",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "accounts.apps.AccountsConfig",
    "blog.apps.BlogConfig",
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

ACCOUNT_LOGIN_METHODS = {"email", "username"}
ACCOUNT_EMAIL_VERIFICATION = "none"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
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

_DATABASE_URL = os.getenv("DATABASE_URL")
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
    _env_postgres_host = os.getenv("POSTGRES_HOST")
    if _env_postgres_host:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": _env("POSTGRES_DB", "postgres"),
                "USER": _env("POSTGRES_USER", "postgres"),
                "PASSWORD": _env("POSTGRES_PASSWORD", "postgres"),
                "HOST": _env_postgres_host,
                "PORT": str(_env("POSTGRES_PORT", "5432")),
            }
        }
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
LANGUAGES = (
    ("es", "Español"),
    ("en", "English"),
)
I18N_ENABLED = True
TIME_ZONE = "Europe/Madrid"
USE_I18N = True
USE_TZ = True
PARLER_DEFAULT_LANGUAGE_CODE = LANGUAGE_CODE
PARLER_LANGUAGES = {
    1: tuple({"code": code} for code, _name in LANGUAGES),
    "default": {
        "fallbacks": [LANGUAGE_CODE],
        "hide_untranslated": False,
    },
}

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

_static_dir = BASE_DIR / "static"
if _static_dir.exists():
    STATICFILES_DIRS = [_static_dir]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SECURE_SSL_REDIRECT = _env_bool("SECURE_SSL_REDIRECT", False)
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
        "rest_framework_simplejwt.authentication.JWTAuthentication",
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
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/day",
        "user": "1000/day",
        "reactions": "30/min",
        "openai": _env("OPENAI_THROTTLE", "20/min"),
    },
}

REST_USE_JWT = True
REST_AUTH_TOKEN_MODEL = None
REST_AUTH = {
    "USE_JWT": True,
    "SESSION_LOGIN": False,
    "TOKEN_MODEL": None,
    "JWT_AUTH_COOKIE": None,
    "JWT_AUTH_REFRESH_COOKIE": None,
    "JWT_AUTH_HTTPONLY": False,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = _env(
        "EMAIL_BACKEND",
        "django.core.mail.backends.smtp.EmailBackend",
    )

EMAIL_HOST = _env("EMAIL_HOST", "") or ""
_email_port = _env("EMAIL_PORT", "587") or "587"
try:
    EMAIL_PORT = int(_email_port)
except (TypeError, ValueError):
    EMAIL_PORT = 587
EMAIL_HOST_USER = _env("EMAIL_HOST_USER", "") or ""
EMAIL_HOST_PASSWORD = _env("EMAIL_HOST_PASSWORD", "") or ""
EMAIL_USE_TLS = _env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = _env_bool("EMAIL_USE_SSL", False)
if EMAIL_USE_SSL:
    EMAIL_USE_TLS = False
DEFAULT_FROM_EMAIL = _env(
    "DEFAULT_FROM_EMAIL",
    "CodexTest Blog <no-reply@codextest.local>",
)

OPENAI_API_URL = _env("OPENAI_API_URL", "https://api.openai.com/v1/responses") or "https://api.openai.com/v1/responses"
_openai_api_key = _env("OPENAI_API_KEY")
if _openai_api_key:
    OPENAI_API_KEY = _openai_api_key
else:
    OPENAI_API_KEY = _env("VITE_OPEN_IA_KEY", "") or ""
OPENAI_DEFAULT_MODEL = _env("OPENAI_DEFAULT_MODEL", "gpt-4o-mini") or "gpt-4o-mini"
OPENAI_SYSTEM_PROMPT = _env(
    "OPENAI_SYSTEM_PROMPT",
    (
        "Eres un asistente de traducción para un blog técnico. Conserva formato "
        "Markdown/HTML, respeta enlaces y código, no inventes contenido."
    ),
)
OPENAI_REQUEST_TIMEOUT = _env_float("OPENAI_REQUEST_TIMEOUT", 15.0)
OPENAI_MAX_TEXT_LENGTH = _env_int("OPENAI_MAX_TEXT_LENGTH", 2000)

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
