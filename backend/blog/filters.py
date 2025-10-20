"""Filter definitions for translation-aware lookups."""
from __future__ import annotations

import django_filters

from .models import Post


class PostFilterSet(django_filters.FilterSet):
    """Expose legacy query parameters while targeting translated columns."""

    tags__name = django_filters.CharFilter(
        field_name="tags__translations__name", lookup_expr="exact"
    )
    categories__slug = django_filters.CharFilter(
        field_name="categories__translations__slug", lookup_expr="exact"
    )
    categories__name = django_filters.CharFilter(
        field_name="categories__translations__name", lookup_expr="exact"
    )

    class Meta:
        model = Post
        fields: list[str] = []
