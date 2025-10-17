"""Serializers for the blog API."""
from __future__ import annotations

from typing import Iterable

from rest_framework import serializers

from .models import Post, Tag


class TagNameField(serializers.SlugRelatedField):
    """Slug field that creates tags on demand."""

    def to_internal_value(self, data):  # type: ignore[override]
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            if not isinstance(data, str):
                raise
            obj, _ = Tag.objects.get_or_create(name=data)
            return obj


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["name"]


class PostSerializer(serializers.ModelSerializer):
    tags = TagNameField(many=True, slug_field="name", queryset=Tag.objects.all())

    class Meta:
        model = Post
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "content",
            "date",
            "image",
            "thumb",
            "imageAlt",
            "author",
            "tags",
        ]
        read_only_fields = ["id", "slug"]

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

    def _set_tags(self, post: Post, tags: Iterable[Tag]):
        post.tags.set(tags)
