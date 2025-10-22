"""Admin registrations for the blog app."""
from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from .models import Category, Comment, Post, Reaction, Tag


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
    list_display = ["title", "status", "date", "author", "created_by", "modified_by"]
    list_filter = ["status", "date", "tags", "categories", "created_by"]
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
    readonly_fields = ["created_by", "modified_by"]

    actions = ["action_mark_draft", "action_mark_in_review", "action_publish"]

    def save_model(self, request, obj, form, change):  # type: ignore[override]
        if not change and not getattr(obj, "created_by", None):
            obj.created_by = request.user
        obj.modified_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):  # type: ignore[override]
        queryset = super().get_queryset(request)
        if request.user.has_perm("blog.can_publish_post") or request.user.is_superuser:
            return queryset
        if request.user.has_perm("blog.change_post"):
            return queryset.filter(created_by=request.user)
        return queryset

    def get_actions(self, request):  # type: ignore[override]
        actions = super().get_actions(request)
        if not request.user.has_perm("blog.change_post"):
            actions.pop("action_mark_draft", None)
        if not request.user.has_perm("blog.can_approve_post"):
            actions.pop("action_mark_in_review", None)
        if not request.user.has_perm("blog.can_publish_post"):
            actions.pop("action_publish", None)
        return actions

    @admin.action(description=_("Marcar como borrador"))
    def action_mark_draft(self, request, queryset):
        queryset.update(status=Post.Status.DRAFT)

    @admin.action(description=_("Enviar a revisión"))
    def action_mark_in_review(self, request, queryset):
        queryset.update(status=Post.Status.IN_REVIEW)

    @admin.action(description=_("Publicar entradas seleccionadas"))
    def action_publish(self, request, queryset):
        queryset.update(status=Post.Status.PUBLISHED)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["post", "author_name", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["author_name", "content", "post__translations__title"]
    ordering = ["-created_at"]


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "content_type", "object_id", "type", "created_at"]
    list_filter = ["type", "content_type", "created_at"]
    search_fields = ["user__username"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at"]
