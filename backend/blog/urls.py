"""URL configuration for the blog API using routers."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, CommentViewSet, PostViewSet, TagViewSet

app_name = "blog"

router = DefaultRouter()
router.register("posts", PostViewSet, basename="posts")
router.register("categories", CategoryViewSet, basename="categories")
router.register("tags", TagViewSet, basename="tags")

comment_list = CommentViewSet.as_view({
    "get": "list",
    "post": "create",
})

urlpatterns = [
    path("", include(router.urls)),
    path("posts/<slug:slug_pk>/comments/", comment_list, name="post-comments-list"),
]
