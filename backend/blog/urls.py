"""URL configuration for the blog API using routers."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    CommentViewSet,
    MeView,
    OpenAITranslationViewSet,
    PostViewSet,
    RoleManagementViewSet,
    TagViewSet,
)

app_name = "blog"

router = DefaultRouter()
router.register("posts", PostViewSet, basename="posts")
router.register("categories", CategoryViewSet, basename="categories")
router.register("tags", TagViewSet, basename="tags")
router.register("ai/translations", OpenAITranslationViewSet, basename="ai-translations")

comment_list = CommentViewSet.as_view({
    "get": "list",
    "post": "create",
})
comment_detail = CommentViewSet.as_view({
    "delete": "destroy",
})


me_view = MeView.as_view()
roles_view = RoleManagementViewSet.as_view({
    "get": "list",
    "post": "create",
})

urlpatterns = [
    path("", include(router.urls)),
    path("me/", me_view, name="me"),
    path("roles/", roles_view, name="roles"),
    path("posts/<slug:slug_pk>/comments/", comment_list, name="post-comments-list"),
    path("posts/<slug:slug_pk>/comments/<int:pk>/", comment_detail, name="post-comments-detail"),
]
