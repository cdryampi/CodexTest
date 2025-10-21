"""Serializers for the blog API."""
from __future__ import annotations

from collections import OrderedDict
from datetime import date as date_cls, datetime
from typing import Iterable

from django.conf import settings
from django.contrib.auth import get_user_model
from parler_rest.serializers import TranslatableModelSerializer
from rest_framework import serializers

from .models import Category, Comment, Post, Reaction, Tag
from .utils.i18n import set_parler_language, slugify_localized
from parler.utils.context import switch_language


class _TranslationAwareSerializer(TranslatableModelSerializer):
    """Base serializer that exposes parler translations when requested."""

    translations = serializers.SerializerMethodField()

    def _language_code(self) -> str:
        request = self.context.get("request")
        if request is not None and hasattr(request, "LANGUAGE_CODE"):
            return request.LANGUAGE_CODE
        return self.context.get("language_code", settings.LANGUAGE_CODE)

    def _should_expand_translations(self) -> bool:
        request = self.context.get("request")
        if request is None:
            return bool(self.context.get("expand_translations"))

        params = getattr(request, "query_params", None) or getattr(request, "GET", None)
        if not params:
            return False

        values: list[str] = []
        if hasattr(params, "getlist"):
            values.extend(params.getlist("expand"))
        else:  # pragma: no cover - legacy mapping fallback
            expand_value = params.get("expand")
            if expand_value:
                values.append(expand_value)

        for raw_value in values:
            if not raw_value:
                continue
            normalized = [part.strip() for part in raw_value.split(",") if part.strip()]
            for part in normalized:
                if part.lower() == "translations":
                    return True
                if part.lower().startswith("translations="):
                    flag = part.split("=", 1)[1].lower()
                    if flag in {"1", "true", "yes"}:
                        return True
        return False

    def to_representation(self, instance):  # type: ignore[override]
        data = super().to_representation(instance)
        if not self._should_expand_translations():
            data.pop("translations", None)
        return data

    def get_translations(self, instance):
        if not self._should_expand_translations():
            return None

        translated_fields = getattr(instance._parler_meta, "get_translated_fields", lambda: [])()
        language_codes = [code for code, _ in getattr(settings, "LANGUAGES", ())]
        if not language_codes:
            language_codes = [self._language_code()]

        result = OrderedDict()
        for language_code in language_codes:
            with switch_language(instance, language_code):
                result[language_code] = {
                    field_name: getattr(instance, field_name)
                    for field_name in translated_fields
                }
        return result


class CategorySerializer(_TranslationAwareSerializer):
    """Public representation of a blog category."""

    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "name",
            "slug",
            "description",
            "is_active",
            "post_count",
            "translations",
        ]
        read_only_fields = ["slug", "post_count", "translations"]

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


class TagSerializer(_TranslationAwareSerializer):
    """Public representation of a tag with optional post counts."""

    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = [
            "name",
            "slug",
            "post_count",
            "translations",
        ]
        read_only_fields = ["slug", "post_count", "translations"]

    def get_post_count(self, obj: Tag) -> int:
        """Return the number of posts associated with the tag when available."""

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

        value = data.strip()
        if not value:
            raise serializers.ValidationError("Este campo no puede estar vacío.")

        request = self.context.get("request")
        if request is not None and hasattr(request, "LANGUAGE_CODE"):
            language_code = request.LANGUAGE_CODE
        else:
            language_code = self.context.get("language_code", settings.LANGUAGE_CODE)
        existing = (
            Tag.objects.language(language_code)
            .filter(name__iexact=value)
            .first()
        )
        if existing:
            return existing

        tag = Tag()
        with switch_language(tag, language_code):
            tag.name = value
            tag.slug = slugify_localized(value, language_code)
        tag.full_clean()
        tag.save()
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
        """
        Return an ISO formatted date string for ``value`` when possible.

        - If ``value`` is a datetime or date, return its ISO format string.
        - If ``value`` is None, return None.
        - For any other type, return None.
        """
        if value is None:
            return None
        if isinstance(value, datetime):
            value = value.date()
        if isinstance(value, date_cls):
            return value.isoformat()
        return None

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


class PostListSerializer(
    _PostCategoryRepresentationMixin, _TranslationAwareSerializer
):
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
            "translations",
        ]
        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "image",
            "categories",
            "categories_detail",
            "translations",
        ]

    def to_representation(self, instance):  # type: ignore[override]
        data = super().to_representation(instance)
        return self._ensure_category_lists(data)

    def get_created_at(self, instance: Post):
        """
        Retrieve the 'created_at' value for the post.

        This method uses `getattr` with a default of None to safely access the `date`
        attribute on the instance, which may not always be present. This approach
        replaces a direct DateField mapping to allow for flexibility in how the date
        is provided (e.g., as a `datetime`, `date`, or possibly missing).

        The `_serialize_date` helper ensures that if the value is a `datetime` or `date`
        object, it is returned as an ISO-formatted string. If the attribute is missing
        or not a date type, `None` is returned.
        """
        return self._serialize_date(getattr(instance, "date", None))


class PostDetailSerializer(
    _PostCategoryRepresentationMixin, _TranslationAwareSerializer
):
    """Detailed serializer for retrieving and creating posts."""

    title = serializers.CharField()
    excerpt = serializers.CharField()
    content = serializers.CharField()
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
            "translations",
        ]
        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
            "categories_detail",
            "translations",
        ]

    def get_created_at(self, obj: Post):
        """
        Retrieve the creation date for the post.

        Uses getattr with a default of None to gracefully handle cases where the
        'date' attribute may not be present on the object (e.g., if the model changes
        or the attribute is omitted in certain querysets). This replaces a direct
        DateField mapping to allow for more flexible handling.

        The value may be a date, datetime, or None. The _serialize_date helper
        method is responsible for converting these types to the appropriate
        serialized representation (e.g., ISO 8601 string or null).
        """
        return self._serialize_date(getattr(obj, "date", None))

    def get_updated_at(self, obj: Post):
        """
        Return the last updated date. Currently uses the publication date as the model doesn't track separate update timestamps.
        """
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
        language_code = self._language_code()
        with set_parler_language(language_code):
            post = Post.objects.create(**validated_data)
            post.set_current_language(language_code)
        self._set_tags(post, tags)
        self._set_categories(post, categories)
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        categories = validated_data.pop("categories", None)
        language_code = self._language_code()
        with set_parler_language(language_code):
            if hasattr(instance, "set_current_language"):
                instance.set_current_language(language_code)
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


class ReactionSerializer(serializers.ModelSerializer):
    """Public representation of a reaction."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ["id", "user", "type", "created_at"]
        read_only_fields = ["id", "user", "created_at", "type"]


class ReactionToggleSerializer(serializers.Serializer):
    """Serializer validating the incoming reaction type for toggling."""

    type = serializers.ChoiceField(choices=Reaction.Types.choices)


class ReactionSummarySerializer(serializers.Serializer):
    """Aggregate representation of reactions for a content object."""

    counts = serializers.DictField(child=serializers.IntegerField(min_value=0), default=dict)
    total = serializers.IntegerField(min_value=0)
    my_reaction = serializers.ChoiceField(
        choices=Reaction.Types.choices,
        allow_null=True,
        required=False,
    )

