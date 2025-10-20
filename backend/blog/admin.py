"""Admin configuration for blog app."""
from __future__ import annotations

from django.contrib import admin
from parler.admin import TranslatableAdmin

from .models import Category, Post, Reaction, Tag


@admin.register(Category)
class CategoryAdmin(TranslatableAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["translations__name", "translations__description"]
    ordering = ["translations__name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Tag)
class TagAdmin(TranslatableAdmin):
    search_fields = ["translations__name", "translations__slug"]
    ordering = ["translations__name"]


@admin.register(Post)
class PostAdmin(TranslatableAdmin):
    list_display = ["title", "date", "author"]
    list_filter = ["date", "tags", "categories"]
    search_fields = [
        "translations__title",
        "translations__excerpt",
        "translations__content",
        "tags__translations__name",
        "categories__translations__name",
        "author",
    ]
    filter_horizontal = ["tags", "categories"]
    ordering = ["-date"]
    date_hierarchy = "date"


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "content_type", "object_id", "type", "created_at"]
    list_filter = ["type", "content_type", "created_at"]
    search_fields = ["user__username"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at"]
