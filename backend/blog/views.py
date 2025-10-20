"""ViewSets for the blog API."""

from __future__ import annotations

from django.db.models import Count, F, Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Category, Comment, Post, Reaction
from .serializers import (
    CategorySerializer,
    CommentSerializer,
    PostDetailSerializer,
    PostListSerializer,
    ReactionSummarySerializer,
    ReactionToggleSerializer,
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

    def get_throttles(self):  # type: ignore[override]
        if getattr(self, "action", None) in {"reactions", "react"}:
            self.throttle_scope = "reactions"
        else:
            self.throttle_scope = None
        return super().get_throttles()

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

    def _get_reaction_queryset(self, post: Post):
        return Reaction.objects.for_instance(post)

    def _build_reaction_summary(self, post: Post, user):
        reaction_qs = self._get_reaction_queryset(post)
        counts = {choice: 0 for choice, _ in Reaction.Types.choices}
        for row in reaction_qs.values("type").annotate(total=Count("id")):
            counts[row["type"]] = int(row["total"])

        my_reaction = None
        if getattr(user, "is_authenticated", False):
            my_reaction = (
                reaction_qs.filter(user=user)
                .values_list("type", flat=True)
                .first()
            )

        total = int(sum(counts.values()))
        payload = {
            "counts": counts,
            "total": total,
            "my_reaction": my_reaction,
        }
        serializer = ReactionSummarySerializer(payload)
        return serializer.data

    @extend_schema(
        description="Devuelve el resumen de reacciones registradas para la entrada.",
        responses={
            200: ReactionSummarySerializer,
        },
        examples=[
            OpenApiExample(
                "Resumen de ejemplo",
                value={
                    "counts": {
                        "like": 3,
                        "love": 1,
                        "clap": 0,
                        "wow": 2,
                        "laugh": 0,
                        "insight": 0,
                    },
                    "total": 6,
                    "my_reaction": "wow",
                },
                response_only=True,
            ),
        ],
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="reactions",
        url_name="reactions",
        throttle_classes=[ScopedRateThrottle],
    )
    def reactions(self, request, slug=None):
        post = self.get_object()
        summary = self._build_reaction_summary(post, request.user)
        return Response(summary)

    @extend_schema(
        description=(
            "Registra o elimina la reacción del usuario autenticado siguiendo la lógica"
            " de alternancia."
        ),
        request=ReactionToggleSerializer,
        responses={
            200: ReactionSummarySerializer,
            401: OpenApiResponse(description="Autenticación requerida"),
        },
        examples=[
            OpenApiExample(
                "Solicitud",
                value={"type": "like"},
                request_only=True,
            ),
            OpenApiExample(
                "Respuesta",
                value={
                    "counts": {
                        "like": 1,
                        "love": 0,
                        "clap": 0,
                        "wow": 0,
                        "laugh": 0,
                        "insight": 0,
                    },
                    "total": 1,
                    "my_reaction": "like",
                },
                response_only=True,
            ),
        ],
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="react",
        url_name="react",
        throttle_classes=[ScopedRateThrottle],
    )
    def react(self, request, slug=None):
        post = self.get_object()

        serializer = ReactionToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticación requerida para reaccionar."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        reaction_type = serializer.validated_data["type"]
        reaction_qs = self._get_reaction_queryset(post)
        user_reactions = reaction_qs.filter(user=request.user)
        same_reaction = user_reactions.filter(type=reaction_type).first()

        if same_reaction:
            user_reactions.exclude(pk=same_reaction.pk).delete()
            same_reaction.delete()
        else:
            existing = user_reactions.first()
            if existing:
                user_reactions.exclude(pk=existing.pk).delete()
                existing.type = reaction_type
                existing.save(update_fields=["type"])
            else:
                Reaction.objects.create(
                    user=request.user,
                    content_object=post,
                    type=reaction_type,
                )

        summary = self._build_reaction_summary(post, request.user)
        return Response(summary)


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
