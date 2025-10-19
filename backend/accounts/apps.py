from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Application configuration for authentication endpoints."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "Accounts"
