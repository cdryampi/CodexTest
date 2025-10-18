"""Admin configuration for blog app."""
from __future__ import annotations

from django.contrib import admin

from .models import Category, Post, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["name"]


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
