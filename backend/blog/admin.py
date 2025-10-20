"""Admin configuration for blog app."""
from __future__ import annotations

from django.contrib import admin

from .models import Category, Post, Reaction, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ["name"]
    ordering = ["name"]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "date", "author"]
    list_filter = ["date", "tags", "categories"]
    search_fields = [
        "title",
        "excerpt",
        "content",
        "tags__name",
        "categories__name",
        "author",
    ]
    filter_horizontal = ["tags", "categories"]
    ordering = ["-date"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "date"


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ["content_type", "object_id", "user", "type", "created_at"]
    list_filter = ["content_type", "type", "user"]
    search_fields = ["user__username", "user__email", "content_type__model"]
    autocomplete_fields = ["user"]
    readonly_fields = ["created_at"]
