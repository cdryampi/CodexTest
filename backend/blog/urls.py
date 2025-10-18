"""URL configuration for the blog API using routers."""
from __future__ import annotations

from django.urls import include, path
from rest_framework_nested.routers import NestedSimpleRouter, SimpleRouter

from .views import CommentViewSet, PostViewSet

app_name = "blog"

router = SimpleRouter()
router.register("posts", PostViewSet, basename="posts")

comments_router = NestedSimpleRouter(router, r"posts", lookup="slug")
comments_router.register("comments", CommentViewSet, basename="post-comments")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(comments_router.urls)),
]
