"""Blog app models."""
from __future__ import annotations

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import class_prepared
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager, TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields

from .utils.i18n import slugify_localized
def _translation_class_prepared(sender, **kwargs) -> None:
    """Configure parler translation models once they are ready."""

    if sender._meta.app_label != "blog":
        return

    if sender.__name__ == "CategoryTranslation":
        sender._meta.indexes = [
            models.Index(
                fields=["language_code", "name"],
                name="category_lang_name_idx",
            )
        ]
    elif sender.__name__ == "TagTranslation":
        sender._meta.indexes = [
            models.Index(
                fields=["language_code", "name"],
                name="tag_lang_name_idx",
            )
        ]
    elif sender.__name__ == "PostTranslation":
        sender._meta.indexes = [
            models.Index(
                fields=["language_code", "title"],
                name="post_lang_title_idx",
            )
        ]
    else:
        return

    sender._meta.unique_together = (
        ("language_code", "master"),
        ("language_code", "slug"),
    )


class_prepared.connect(_translation_class_prepared)


class TranslationAwareQuerySet(TranslatableQuerySet):
    """Queryset that transparently proxies translated field lookups."""

    def _translated_field_names(self) -> set[str]:
        return set(self.model._parler_meta.get_translated_fields())

    def _rewrite_lookup_key(self, key: str) -> str:
        if key.startswith("translations__"):
            return key

        parts = key.split("__")
        rewritten: list[str] = []
        model: type[models.Model] | None = self.model

        idx = 0
        while idx < len(parts):
            part = parts[idx]

            if part == "translations":
                rewritten.extend(parts[idx:])
                break

            if (
                model is not None
                and issubclass(model, TranslatableModel)
                and part in model._parler_meta.get_translated_fields()
            ):
                rewritten.extend(["translations", part])
                model = None
                idx += 1
                continue

            field = None
            if model is not None:
                try:
                    field = model._meta.get_field(part)
                except Exception:  # pragma: no cover - defensive guard
                    field = None

            if field is None:
                rewritten.append(part)
                model = None
            else:
                rewritten.append(part)
                related_model = getattr(field, "related_model", None)
                if related_model is None and getattr(field, "remote_field", None):
                    related_model = getattr(field.remote_field, "model", None)
                model = related_model if isinstance(related_model, type) else None

            idx += 1

        return "__".join(rewritten)

    def _rewrite_q(self, expression: Q) -> Q:
        new_q = Q()
        new_q.connector = expression.connector
        new_q.negated = expression.negated
        for child in expression.children:
            if isinstance(child, Q):
                new_q.children.append(self._rewrite_q(child))
            else:
                key, value = child
                new_q.children.append((self._rewrite_lookup_key(key), value))
        return new_q

    def _rewrite_args(self, args: tuple) -> tuple:
        rewritten: list = []
        for arg in args:
            if isinstance(arg, Q):
                rewritten.append(self._rewrite_q(arg))
            else:
                rewritten.append(arg)
        return tuple(rewritten)

    def _rewrite_kwargs(self, kwargs: dict) -> dict:
        return {self._rewrite_lookup_key(key): value for key, value in kwargs.items()}

    def filter(self, *args, **kwargs):  # type: ignore[override]
        return super().filter(*self._rewrite_args(args), **self._rewrite_kwargs(kwargs))

    def exclude(self, *args, **kwargs):  # type: ignore[override]
        return super().exclude(*self._rewrite_args(args), **self._rewrite_kwargs(kwargs))

    def get(self, *args, **kwargs):  # type: ignore[override]
        return super().get(*self._rewrite_args(args), **self._rewrite_kwargs(kwargs))

    def update(self, **kwargs):  # type: ignore[override]
        return super().update(**self._rewrite_kwargs(kwargs))

    def values(self, *fields, **expressions):  # type: ignore[override]
        rewritten_fields = [self._rewrite_lookup_key(field) for field in fields]
        rewritten_expressions = {
            self._rewrite_lookup_key(key): value for key, value in expressions.items()
        }
        return super().values(*rewritten_fields, **rewritten_expressions)

    def values_list(self, *fields, **kwargs):  # type: ignore[override]
        rewritten_fields = [self._rewrite_lookup_key(field) for field in fields]
        return super().values_list(*rewritten_fields, **kwargs)

    def order_by(self, *field_names):  # type: ignore[override]
        rewritten = []
        for field in field_names:
            prefix = ""
            if field.startswith("-"):
                prefix = "-"
                field = field[1:]
            rewritten.append(f"{prefix}{self._rewrite_lookup_key(field)}")
        return super().order_by(*rewritten)


class TranslationAwareManager(TranslatableManager):
    """Manager using the translation aware queryset by default."""

    queryset_class = TranslationAwareQuerySet

    def get_queryset(self):  # type: ignore[override]
        return self.queryset_class(self.model, using=self._db)


class CategoryQuerySet(TranslationAwareQuerySet):
    """Custom queryset to expose helpers for categories."""

    def active(self):
        return self.filter(is_active=True)


class TranslatableSlugMixin:
    """Mixin encapsulating slug generation and validation per language."""

    slug_field: str = "slug"
    slug_source_field: str = "title"
    slug_fallback: str = "item"

    def _active_language_code(self) -> str:
        language_code = self.get_current_language() or settings.LANGUAGE_CODE
        self.set_current_language(language_code)
        return language_code

    def _base_value_for_slug(self, language_code: str) -> str:
        value = self.safe_translation_getter(
            self.slug_source_field,
            any_language=False,
            language_code=language_code,
        )
        if value:
            return value
        return self.slug_fallback

    def _slug_queryset(self, slug: str, language_code: str):
        lookup = {self.slug_field: slug}
        qs = self.__class__.objects.language(language_code).filter(**lookup)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        return qs

    def _ensure_slug(self) -> None:
        language_code = self._active_language_code()
        raw_value = self.safe_translation_getter(
            self.slug_field,
            any_language=False,
            language_code=language_code,
        )

        if self.pk:
            translation_exists = language_code in getattr(
                self, "get_available_languages", lambda: []
            )()
        else:
            translation_exists = False

        if raw_value:
            base_slug = slugify_localized(raw_value, language_code) or self.slug_fallback
            candidate = base_slug or self.slug_fallback
            setattr(self, self.slug_field, candidate)
            if language_code == settings.LANGUAGE_CODE:
                return
        else:
            base_value = self._base_value_for_slug(language_code)
            base_slug = slugify_localized(base_value, language_code) or self.slug_fallback
            candidate = base_slug or self.slug_fallback

        suffix = 1
        qs = self._slug_queryset(candidate, language_code)
        while qs.exists():
            if raw_value and translation_exists:
                break
            suffix += 1
            candidate = f"{base_slug}-{suffix}"
            qs = self._slug_queryset(candidate, language_code)
        setattr(self, self.slug_field, candidate)

    def _validate_unique_slug(self) -> None:
        slug = self.safe_translation_getter(self.slug_field, any_language=False)
        if not slug:
            return
        language_code = self._active_language_code()
        if self._slug_queryset(slug, language_code).exists():
            raise ValidationError(
                {
                    self.slug_field: _(
                        "El slug '%(slug)s' ya existe para el idioma %(lang)s."
                    )
                    % {"slug": slug, "lang": language_code}
                }
            )


class Category(TranslatableSlugMixin, TranslatableModel):
    """Category grouping posts by topic."""

    translations = TranslatedFields(
        name=models.CharField("Nombre", max_length=150),
        slug=models.SlugField("Slug", max_length=160, blank=True),
        description=models.TextField("Descripción", blank=True),
        Meta={
            "unique_together": (
                ("language_code", "master"),
                ("language_code", "slug"),
            ),
            "indexes": (
                models.Index(
                    fields=["language_code", "name"],
                    name="category_lang_name_idx",
                ),
            ),
        },
    )
    is_active = models.BooleanField("Activa", default=True)
    created_at = models.DateTimeField("Creada", auto_now_add=True)
    updated_at = models.DateTimeField("Actualizada", auto_now=True)

    objects = TranslationAwareManager.from_queryset(CategoryQuerySet)()

    class Meta:
        ordering = ["translations__name"]
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self) -> str:  # pragma: no cover - human-readable only
        return self.name

    def save(self, *args, **kwargs):
        self._ensure_slug()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        self._ensure_slug()
        self._validate_unique_slug()

    slug_source_field = "name"
    slug_fallback = "categoria"


class Tag(TranslatableSlugMixin, TranslatableModel):
    """Tag assigned to posts."""

    translations = TranslatedFields(
        name=models.CharField("Nombre", max_length=100),
        slug=models.SlugField("Slug", max_length=120, blank=True),
        Meta={
            "unique_together": (
                ("language_code", "master"),
                ("language_code", "slug"),
            ),
            "indexes": (
                models.Index(
                    fields=["language_code", "name"],
                    name="tag_lang_name_idx",
                ),
            ),
        },
    )

    objects = TranslationAwareManager()

    class Meta:
        ordering = ["translations__name"]
        verbose_name = "Etiqueta"
        verbose_name_plural = "Etiquetas"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        self._ensure_slug()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        self._ensure_slug()
        self._validate_unique_slug()

    slug_source_field = "name"
    slug_fallback = "etiqueta"


class Post(TranslatableSlugMixin, TranslatableModel):
    """Blog post."""

    translations = TranslatedFields(
        title=models.CharField("Título", max_length=255),
        slug=models.SlugField("Slug", max_length=255, blank=True),
        excerpt=models.TextField("Resumen"),
        content=models.TextField("Contenido"),
        Meta={
            "unique_together": (
                ("language_code", "master"),
                ("language_code", "slug"),
            ),
            "indexes": (
                models.Index(
                    fields=["language_code", "title"],
                    name="post_lang_title_idx",
                ),
            ),
        },
    )
    date = models.DateField("Fecha", default=timezone.now)
    image = models.URLField("Imagen")
    thumb = models.URLField("Miniatura")
    imageAlt = models.CharField("Texto alternativo", max_length=255)
    author = models.CharField("Autor", max_length=255)
    tags = models.ManyToManyField(Tag, related_name="posts", verbose_name="Etiquetas")
    categories = models.ManyToManyField(
        Category,
        related_name="posts",
        verbose_name="Categorías",
        blank=True,
    )

    objects = TranslationAwareManager()

    class Meta:
        ordering = ["-date", "-id"]
        verbose_name = "Entrada"
        verbose_name_plural = "Entradas"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        self._ensure_slug()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        self._ensure_slug()
        self._validate_unique_slug()

    slug_source_field = "title"
    slug_fallback = "post"


def _translation_class_prepared(sender, **kwargs) -> None:
    """Configure parler translation models once they are ready."""

    if sender._meta.app_label != "blog":
        return

    if sender.__name__ == "CategoryTranslation":
        sender._meta.indexes = [
            models.Index(
                fields=["language_code", "name"],
                name="category_lang_name_idx",
            )
        ]
    elif sender.__name__ == "TagTranslation":
        sender._meta.indexes = [
            models.Index(
                fields=["language_code", "name"],
                name="tag_lang_name_idx",
            )
        ]
    elif sender.__name__ == "PostTranslation":
        sender._meta.indexes = [
            models.Index(
                fields=["language_code", "title"],
                name="post_lang_title_idx",
            )
        ]
    else:
        return

    sender._meta.unique_together = (
        ("language_code", "master"),
        ("language_code", "slug"),
    )


class_prepared.connect(_translation_class_prepared)


class Comment(models.Model):
    """Comment associated to a post."""

    post = models.ForeignKey(
        Post,
        related_name="comments",
        on_delete=models.CASCADE,
        verbose_name="Entrada",
    )
    author_name = models.CharField("Autor", max_length=255)
    content = models.TextField("Contenido")
    created_at = models.DateTimeField("Creado", default=timezone.now)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Comentario"
        verbose_name_plural = "Comentarios"

    def __str__(self) -> str:
        author = self.author_name or "Anónimo"
        return f"{author} en {self.post.title}"


class ReactionQuerySet(models.QuerySet):
    """Custom queryset with helpers for reaction aggregations."""

    def for_instance(self, instance: models.Model) -> "ReactionQuerySet":
        """Filter reactions for the provided model instance."""

        content_type = ContentType.objects.get_for_model(instance, for_concrete_model=False)
        return self.filter(content_type=content_type, object_id=instance.pk)


class Reaction(models.Model):
    """Reaction attached to any content object such as posts or comments."""

    class Types(models.TextChoices):
        LIKE = "like", "Me gusta"
        LOVE = "love", "Me encanta"
        CLAP = "clap", "Aplausos"
        WOW = "wow", "Asombro"
        LAUGH = "laugh", "Me divierte"
        INSIGHT = "insight", "Interesante"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reactions",
        verbose_name="Usuario",
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    type = models.CharField("Tipo", max_length=20, choices=Types.choices)
    created_at = models.DateTimeField("Creado", auto_now_add=True)

    objects = ReactionQuerySet.as_manager()

    class Meta:
        verbose_name = "Reacción"
        verbose_name_plural = "Reacciones"
        unique_together = ("user", "content_type", "object_id", "type")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "content_type", "object_id"]),
        ]
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:  # pragma: no cover - human readable helper
        return f"{self.get_type_display()} por {self.user}"
