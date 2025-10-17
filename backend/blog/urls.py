"""URL configuration for the blog API."""
from __future__ import annotations

from django.urls import path

from .views import PostDetailView, PostListCreateView

urlpatterns = [
    path("posts/", PostListCreateView.as_view(), name="post-list"),
    path("posts/<slug:slug>/", PostDetailView.as_view(), name="post-detail"),
]
