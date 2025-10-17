"""Admin configuration for blog app."""
from __future__ import annotations

from django.contrib import admin

from .models import Post, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ["name"]
    ordering = ["name"]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "date", "author"]
    list_filter = ["date", "tags"]
    search_fields = ["title", "excerpt", "content", "tags__name", "author"]
    filter_horizontal = ["tags"]
    ordering = ["-date"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "date"
