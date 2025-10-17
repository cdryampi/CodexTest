"""Views for the blog API."""
from __future__ import annotations

from rest_framework import generics

from .models import Post
from .serializers import PostSerializer


class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.prefetch_related("tags").order_by("-date")
    serializer_class = PostSerializer
    search_fields = ["title", "tags__name"]
    ordering = ["-date"]

    def get_queryset(self):
        return super().get_queryset().distinct()


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.prefetch_related("tags")
    serializer_class = PostSerializer
    lookup_field = "slug"
