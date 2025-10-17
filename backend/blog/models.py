"""Blog app models."""
from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


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
