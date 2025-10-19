"""ViewSets for the blog API."""

from __future__ import annotations

from django.db.models import Count, F, Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import Category, Comment, Post
from .serializers import (
    CategorySerializer,
    CommentSerializer,
    PostDetailSerializer,
    PostListSerializer,
)


class PostViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Manage blog posts using viewsets."""

    queryset = (
        Post.objects.annotate(created_at=F("date"))
        .prefetch_related("tags", "categories")
        .order_by("-date", "-id")
    )
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    filterset_fields = ["tags__name", "categories__slug", "categories__name"]
    search_fields = ["title", "content", "tags__name", "categories__name"]
    ordering_fields = ["date", "created_at", "title"]
    ordering = ["-date"]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset().distinct()
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(categories__slug__iexact=category_slug)
        return queryset

    def get_serializer_class(self):  # type: ignore[override]
        if self.action == "list":
            return PostListSerializer
        return PostDetailSerializer


class CategoryViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Expose categories with read access for everyone."""

    serializer_class = CategorySerializer
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    permission_classes = [IsAuthenticatedOrReadOnly]
    ordering = ["name"]

    def get_queryset(self):
        queryset = Category.objects.all()
        params = self.request.query_params
        search_term = params.get("q")
        if search_term:
            search_term = search_term.strip()
            queryset = queryset.filter(
                Q(name__icontains=search_term)
                | Q(description__icontains=search_term)
            )

        is_active = params.get("is_active")
        if is_active is not None:
            normalized = is_active.lower()
            if normalized in {"true", "1", "yes"}:
                queryset = queryset.filter(is_active=True)
            elif normalized in {"false", "0", "no"}:
                queryset = queryset.filter(is_active=False)

        with_counts = params.get("with_counts")
        if with_counts is not None and with_counts.lower() in {"1", "true", "yes"}:
            queryset = queryset.annotate(post_count=Count("posts", distinct=True))

        return queryset.order_by(*self.ordering).distinct()


class CommentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Manage comments nested under posts."""

    serializer_class = CommentSerializer
    search_fields = ["content", "author_name"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def _get_post(self) -> Post:
        """Return the parent post identified by the slug in the URL."""

        if hasattr(self, "_post_cache"):
            return self._post_cache

        slug = (
            self.kwargs.get("slug_pk")
            or self.kwargs.get("slug")
            or self.kwargs.get("post_pk")
            or self.kwargs.get("post_slug")
        )

        if not slug:
            raise Http404("No se proporcionó el slug de la publicación.")

        self._post_cache = get_object_or_404(Post.objects.all(), slug=slug)
        return self._post_cache

    def get_queryset(self):  # type: ignore[override]
        post = self._get_post()
        return (
            Comment.objects.filter(post=post)
            .select_related("post")
            .order_by("-created_at", "-id")
        )

    def perform_create(self, serializer):  # type: ignore[override]
        serializer.save(post=self._get_post())
