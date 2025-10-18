"""Custom pagination classes for the blog API."""
from __future__ import annotations

from rest_framework.pagination import PageNumberPagination


class DefaultPageNumberPagination(PageNumberPagination):
    """Default page number pagination with sensible defaults."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50
    page_query_param = "page"
