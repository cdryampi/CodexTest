"""Serializers for the blog API."""
from __future__ import annotations

from typing import Iterable

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Comment, Post, Tag


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


class PostListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing posts."""

    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    created_at = serializers.DateField(source="date", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "tags",
            "created_at",
            "image",
        ]
        read_only_fields = ["id", "slug", "created_at", "image"]


class PostDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for retrieving and creating posts."""

    tags = TagNameField(many=True, slug_field="name", queryset=Tag.objects.all())
    created_at = serializers.DateField(source="date", read_only=True)
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
            "created_at",
            "updated_at",
            "image",
            "thumb",
            "imageAlt",
            "author",
            "date",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_updated_at(self, obj: Post):
        # The current model only stores the publication date, reuse it for now.
        return obj.date

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
        post = Post.objects.create(**validated_data)
        self._set_tags(post, tags)
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            self._set_tags(instance, tags)
        return instance

    def _set_tags(self, post: Post, tags: Iterable[Tag]) -> None:
        post.tags.set(tags)


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

