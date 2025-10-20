from django.apps import AppConfig


class BlogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "blog"

    def ready(self) -> None:
        super().ready()
        # Import signal handlers to enable post-migrate seeding when configured.
        from . import signals  # noqa: F401

