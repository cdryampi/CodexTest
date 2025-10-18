"""ViewSets for the blog API."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets

from .models import Comment, Post
from .serializers import CommentSerializer, PostDetailSerializer, PostListSerializer


class PostViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Manage blog posts using viewsets."""

    queryset = Post.objects.prefetch_related("tags").order_by("-date", "-id")
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    filterset_fields = ["tags__name"]
    search_fields = ["title", "content", "tags__name"]
    ordering_fields = ["date", "title"]
    ordering = ["-date"]

    def get_queryset(self):
        return super().get_queryset().distinct()

    def get_serializer_class(self):  # type: ignore[override]
        if self.action == "list":
            return PostListSerializer
        return PostDetailSerializer


class CommentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Manage comments nested under posts."""

    serializer_class = CommentSerializer
    search_fields = ["content", "author_name"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):  # type: ignore[override]
        slug = self.kwargs.get("slug_pk")
        post = get_object_or_404(Post.objects.all(), slug=slug)
        return (
            Comment.objects.filter(post=post)
            .select_related("post")
            .order_by("-created_at", "-id")
        )

    def perform_create(self, serializer):  # type: ignore[override]
        slug = self.kwargs.get("slug_pk")
        post = get_object_or_404(Post.objects.all(), slug=slug)
        serializer.save(post=post)
