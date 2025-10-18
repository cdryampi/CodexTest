"""Blog app models."""
from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class CategoryQuerySet(models.QuerySet):
    """Custom queryset to expose helpers for categories."""

    def active(self):
        return self.filter(is_active=True)


class Category(models.Model):
    """Category grouping posts by topic."""

    name = models.CharField("Nombre", max_length=150, unique=True)
    slug = models.SlugField("Slug", max_length=160, unique=True, blank=True)
    description = models.TextField("Descripción", blank=True)
    is_active = models.BooleanField("Activa", default=True)
    created_at = models.DateTimeField("Creada", auto_now_add=True)
    updated_at = models.DateTimeField("Actualizada", auto_now=True)

    objects = CategoryQuerySet.as_manager()

    class Meta:
        ordering = ["name"]
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self) -> str:  # pragma: no cover - human-readable only
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "categoria"
            candidate = base_slug
            suffix = 1
            while Category.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                suffix += 1
                candidate = f"{base_slug}-{suffix}"
            self.slug = candidate
        super().save(*args, **kwargs)


class Tag(models.Model):
    """Tag assigned to posts."""

    name = models.CharField("Nombre", max_length=100, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Etiqueta"
        verbose_name_plural = "Etiquetas"

    def __str__(self) -> str:
        return self.name


class Post(models.Model):
    """Blog post."""

    title = models.CharField("Título", max_length=255)
    slug = models.SlugField("Slug", max_length=255, unique=True, blank=True)
    excerpt = models.TextField("Resumen")
    content = models.TextField("Contenido")
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

    class Meta:
        ordering = ["-date", "-id"]
        verbose_name = "Entrada"
        verbose_name_plural = "Entradas"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or "post"
            candidate = base_slug
            suffix = 1
            while Post.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                suffix += 1
                candidate = f"{base_slug}-{suffix}"
            self.slug = candidate
        super().save(*args, **kwargs)


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
