"""Serializers for the blog API."""
from __future__ import annotations

from datetime import date as date_cls, datetime
from typing import Iterable

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Category, Comment, Post, Tag


class CategorySerializer(serializers.ModelSerializer):
    """Public representation of a blog category."""

    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["name", "slug", "description", "is_active", "post_count"]
        read_only_fields = ["slug", "post_count"]

    def get_post_count(self, obj: Category) -> int:
        """Return the number of posts associated with the category.

        The API can annotate ``post_count`` when explicitly requested, but
        serializers should degrade gracefully if that annotation is not present.
        When the attribute does not exist we fallback to counting the cached
        ``posts`` relation (if it was prefetched) or, as a last resort, perform a
        lightweight count query.
        """

        annotated_value = getattr(obj, "post_count", None)
        try:
            if annotated_value is not None:
                return int(annotated_value)
        except (TypeError, ValueError):
            pass

        if hasattr(obj, "_prefetched_objects_cache"):
            cached = obj._prefetched_objects_cache.get("posts")
            if cached is not None:
                return len(cached)

        related_posts = getattr(obj, "posts", None)
        if hasattr(related_posts, "count"):
            return related_posts.count()

        return 0


class TagNameField(serializers.SlugRelatedField):
    """Slug field that creates tags on demand when writing."""

    def to_internal_value(self, data):  # type: ignore[override]
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            if not isinstance(data, str):
                raise
            tag, _ = Tag.objects.get_or_create(name=data)
            return tag


class UserPublicSerializer(serializers.ModelSerializer):
    """Minimal public representation of a Django user."""

    class Meta:
        model = get_user_model()
        fields = ["username", "email"]
        read_only_fields = fields


class _PostCategoryRepresentationMixin:
    """Mixin to ensure category arrays are always present in API payloads."""

    category_fields = ("categories", "categories_detail")

    @staticmethod
    def _serialize_date(value):
        """Return an ISO formatted date string for ``value`` when possible."""

        if isinstance(value, datetime):
            value = value.date()
        if isinstance(value, date_cls):
            return value.isoformat()
        return value

    def _ensure_category_lists(self, data: dict) -> dict:
        for field in self.category_fields:
            value = data.get(field)
            if isinstance(value, list):
                continue
            if not value:
                data[field] = []
            elif isinstance(value, (set, tuple)):
                data[field] = list(value)
        return data


class PostListSerializer(_PostCategoryRepresentationMixin, serializers.ModelSerializer):
    """Compact serializer for listing posts."""

    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    categories = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="slug"
    )
    categories_detail = CategorySerializer(source="categories", many=True, read_only=True)
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "tags",
            "categories",
            "categories_detail",
            "created_at",
            "image",
        ]
        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "image",
            "categories",
            "categories_detail",
        ]

    def to_representation(self, instance):  # type: ignore[override]
        data = super().to_representation(instance)
        return self._ensure_category_lists(data)

    def get_created_at(self, instance: Post):
        return self._serialize_date(getattr(instance, "date", None))


class PostDetailSerializer(_PostCategoryRepresentationMixin, serializers.ModelSerializer):
    """Detailed serializer for retrieving and creating posts."""

    tags = TagNameField(many=True, slug_field="name", queryset=Tag.objects.all())
    categories = serializers.SlugRelatedField(
        many=True,
        slug_field="slug",
        queryset=Category.objects.all(),
        required=False,
    )
    categories_detail = CategorySerializer(source="categories", many=True, read_only=True)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    date = serializers.DateField(write_only=True, required=False)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "tags",
            "categories",
            "categories_detail",
            "created_at",
            "updated_at",
            "image",
            "thumb",
            "imageAlt",
            "author",
            "date",
        ]
        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
            "categories_detail",
        ]

    def get_created_at(self, obj: Post):
        return self._serialize_date(getattr(obj, "date", None))

    def get_updated_at(self, obj: Post):
        # The current model only stores the publication date, reuse it for now.
        return self._serialize_date(getattr(obj, "date", None))

    def validate_title(self, value: str) -> str:
        if len(value.strip()) < 5:
            raise serializers.ValidationError("El título debe tener al menos 5 caracteres.")
        return value

    def validate_content(self, value: str) -> str:
        if len(value.strip()) < 20:
            raise serializers.ValidationError(
                "El contenido debe tener al menos 20 caracteres para ser publicado."
            )
        return value

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        categories = validated_data.pop("categories", [])
        post = Post.objects.create(**validated_data)
        self._set_tags(post, tags)
        self._set_categories(post, categories)
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        categories = validated_data.pop("categories", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            self._set_tags(instance, tags)
        if categories is not None:
            self._set_categories(instance, categories)
        return instance

    def _set_tags(self, post: Post, tags: Iterable[Tag]) -> None:
        post.tags.set(tags)

    def _set_categories(self, post: Post, categories: Iterable[Category]) -> None:
        post.categories.set(categories)

    def to_representation(self, instance):  # type: ignore[override]
        data = super().to_representation(instance)
        return self._ensure_category_lists(data)


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments nested under posts."""

    post = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author_name", "content", "created_at"]
        read_only_fields = ["id", "post", "created_at"]

    def validate_author_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Debes indicar un nombre de autor.")
        return cleaned

    def validate_content(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 5:
            raise serializers.ValidationError("El comentario debe tener al menos 5 caracteres.")
        return cleaned

