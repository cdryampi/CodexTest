"""ViewSets for the blog API."""

from __future__ import annotations

import logging

from django.conf import settings
from django.db.models import Count, F, Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    extend_schema_view,
)
from rest_framework import exceptions, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .filters import PostFilterSet
from .models import Category, Comment, Post, Reaction, Tag
from . import rbac
from .serializers import (
    CategorySerializer,
    CommentSerializer,
    OpenAITranslationResponseSerializer,
    OpenAITranslationSerializer,
    PostDetailSerializer,
    PostListSerializer,
    TagSerializer,
    ReactionSummarySerializer,
    ReactionToggleSerializer,
    MeSerializer,
    AssignRoleSerializer,
)
from .permissions import (
    CanModerateComments,
    IsAdmin,
    IsAdminOrEditorOrReadOnly,
    IsAdminOrReadOnly,
    IsEditorOrAuthorCanEditOwnDraft,
)
from .utils.i18n import get_active_language, set_parler_language
from .utils.openai import (
    OpenAIConfigurationError,
    OpenAIRequestError,
    translate_text,
)


logger = logging.getLogger(__name__)


class LanguageNegotiationMixin:
    """Resolve the active language and expose it to serializers and responses."""

    language_code: str = settings.LANGUAGE_CODE

    def initial(self, request, *args, **kwargs):  # type: ignore[override]
        self.language_code = get_active_language(request)
        self._language_context = set_parler_language(self.language_code)
        self._language_context.__enter__()
        if request is not None:
            setattr(request, "LANGUAGE_CODE", self.language_code)
        return super().initial(request, *args, **kwargs)

    def finalize_response(self, request, response, *args, **kwargs):  # type: ignore[override]
        response = super().finalize_response(request, response, *args, **kwargs)
        if response is not None and self.language_code:
            response["Content-Language"] = self.language_code
        language_context = getattr(self, "_language_context", None)
        if language_context is not None:
            language_context.__exit__(None, None, None)
            setattr(self, "_language_context", None)
        return response

    def get_serializer_context(self):  # type: ignore[override]
        context = super().get_serializer_context()
        context["language_code"] = self.language_code
        return context

    def apply_language(self, queryset):
        return queryset


LANGUAGE_CODES = [code for code, _name in getattr(settings, "LANGUAGES", ())]

LANGUAGE_QUERY_PARAMETER = OpenApiParameter(
    name="lang",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    required=False,
    enum=LANGUAGE_CODES,
    description=(
        "Forzar el idioma activo de la respuesta. Si no se especifica se utiliza "
        "el idioma negociado automáticamente."
    ),
)

EXPAND_TRANSLATIONS_PARAMETER = OpenApiParameter(
    name="expand",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    required=False,
    description=(
        "Incluye `translations` con todas las variantes disponibles cuando se "
        "proporciona `expand=translations` o `expand=translations=true`."
    ),
)

ACCEPT_LANGUAGE_HEADER = OpenApiParameter(
    name="Accept-Language",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.HEADER,
    required=False,
    description="Cabecera HTTP opcional para negociar el idioma de la solicitud.",
)

CONTENT_LANGUAGE_HEADER = OpenApiParameter(
    name="Content-Language",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.HEADER,
    required=False,
    description="Idioma utilizado en el cuerpo de la respuesta.",
)

POST_LIST_PLAIN_EXAMPLE = OpenApiExample(
    "Listado en modo plano",
    value={
        "count": 1,
        "next": None,
        "previous": None,
        "results": [
            {
                "id": 1,
                "title": "Optimiza el renderizado en React",
                "slug": "optimiza-el-renderizado-en-react",
                "excerpt": "Mejora el rendimiento renderizando solo lo necesario...",
                "tags": ["react", "performance"],
                "categories": ["frontend"],
                "categories_detail": [
                    {
                        "name": "Frontend",
                        "slug": "frontend",
                        "description": "Noticias y tutoriales sobre UI",
                        "is_active": True,
                        "post_count": 4,
                    }
                ],
                "created_at": "2024-02-01",
                "image": "https://cdn.example.com/posts/react.png",
            }
        ],
    },
    response_only=True,
)

POST_LIST_EXPANDED_EXAMPLE = OpenApiExample(
    "Listado con traducciones",
    value={
        "count": 1,
        "next": None,
        "previous": None,
        "results": [
            {
                "id": 1,
                "title": "Optimiza el renderizado en React",
                "slug": "optimiza-el-renderizado-en-react",
                "excerpt": "Mejora el rendimiento renderizando solo lo necesario...",
                "tags": ["react", "performance"],
                "categories": ["frontend"],
                "categories_detail": [],
                "created_at": "2024-02-01",
                "image": "https://cdn.example.com/posts/react.png",
                "translations": {
                    "es": {
                        "title": "Optimiza el renderizado en React",
                        "slug": "optimiza-el-renderizado-en-react",
                        "excerpt": "Mejora el rendimiento renderizando solo lo necesario...",
                    },
                    "en": {
                        "title": "Optimize rendering in React",
                        "slug": "optimize-rendering-in-react",
                        "excerpt": "Improve performance by rendering only what's needed...",
                    },
                },
            }
        ],
    },
    response_only=True,
)

POST_DETAIL_PLAIN_EXAMPLE = OpenApiExample(
    "Detalle en modo plano",
    value={
        "id": 1,
        "title": "Optimiza el renderizado en React",
        "slug": "optimiza-el-renderizado-en-react",
        "excerpt": "Mejora el rendimiento renderizando solo lo necesario...",
        "content": "Contenido largo en español...",
        "tags": ["react", "performance"],
        "categories": ["frontend"],
        "categories_detail": [],
        "created_at": "2024-02-01",
        "updated_at": "2024-02-01",
        "image": "https://cdn.example.com/posts/react.png",
        "thumb": "https://cdn.example.com/posts/react-thumb.png",
        "imageAlt": "Ilustración de componentes React",
        "author": "Codex Team",
        "date": "2024-02-01",
    },
    response_only=True,
)

POST_DETAIL_EXPANDED_EXAMPLE = OpenApiExample(
    "Detalle con traducciones",
    value={
        "id": 1,
        "title": "Optimiza el renderizado en React",
        "slug": "optimiza-el-renderizado-en-react",
        "excerpt": "Mejora el rendimiento renderizando solo lo necesario...",
        "content": "Contenido largo en español...",
        "tags": ["react", "performance"],
        "categories": ["frontend"],
        "categories_detail": [
            {
                "name": "Frontend",
                "slug": "frontend",
                "description": "Noticias y tutoriales sobre UI",
                "is_active": True,
                "post_count": 4,
            }
        ],
        "created_at": "2024-02-01",
        "updated_at": "2024-02-01",
        "image": "https://cdn.example.com/posts/react.png",
        "thumb": "https://cdn.example.com/posts/react-thumb.png",
        "imageAlt": "Ilustración de componentes React",
        "author": "Codex Team",
        "date": "2024-02-01",
        "translations": {
            "es": {
                "title": "Optimiza el renderizado en React",
                "slug": "optimiza-el-renderizado-en-react",
                "excerpt": "Mejora el rendimiento renderizando solo lo necesario...",
                "content": "Contenido largo en español...",
            },
            "en": {
                "title": "Optimize rendering in React",
                "slug": "optimize-rendering-in-react",
                "excerpt": "Improve performance by rendering only what's needed...",
                "content": "Long form content in English...",
            },
        },
    },
    response_only=True,
)

TRANSLATED_RESPONSE_DESCRIPTION = (
    "Respuesta localizada. El header `Content-Language` indica el idioma servido."
)

OPENAI_TRANSLATION_REQUEST_EXAMPLE = OpenApiExample(
    "Solicitud de traducción",
    value={
        "text": "<p>Hola mundo</p>",
        "target_lang": "en",
        "source_lang": "es",
        "format": "html",
    },
    request_only=True,
)

OPENAI_TRANSLATION_RESPONSE_EXAMPLE = OpenApiExample(
    "Respuesta de traducción",
    value={
        "translation": "<p>Hello world</p>",
        "target_lang": "en",
        "source_lang": "es",
        "format": "html",
    },
    response_only=True,
)


@extend_schema_view(
    list=extend_schema(
        parameters=[
            LANGUAGE_QUERY_PARAMETER,
            EXPAND_TRANSLATIONS_PARAMETER,
            ACCEPT_LANGUAGE_HEADER,
        ],
        responses={
            200: OpenApiResponse(
                response=TagSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    retrieve=extend_schema(
        parameters=[
            LANGUAGE_QUERY_PARAMETER,
            EXPAND_TRANSLATIONS_PARAMETER,
            ACCEPT_LANGUAGE_HEADER,
        ],
        responses={
            200: OpenApiResponse(
                response=TagSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    create=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            201: OpenApiResponse(
                response=TagSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    update=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            200: OpenApiResponse(
                response=TagSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    partial_update=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            200: OpenApiResponse(
                response=TagSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
)
class TagViewSet(
    LanguageNegotiationMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Expose tags with optional post counters for editorial tools."""

    serializer_class = TagSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    permission_classes = [IsAdminOrEditorOrReadOnly]
    ordering = ["name"]

    def get_queryset(self):
        queryset = self.apply_language(Tag.objects.all())
        params = self.request.query_params
        search_term = params.get("q")
        if search_term:
            search_term = search_term.strip()
            if search_term:
                queryset = queryset.filter(name__icontains=search_term)
                queryset = queryset.filter(
                    translations__language_code=self.language_code
                )

        with_counts = params.get("with_counts")
        if with_counts is not None and with_counts.lower() in {"1", "true", "yes"}:
            queryset = queryset.annotate(post_count=Count("posts", distinct=True))

        return queryset.order_by(*self.ordering).distinct()


@extend_schema_view(
    list=extend_schema(
        parameters=[
            LANGUAGE_QUERY_PARAMETER,
            EXPAND_TRANSLATIONS_PARAMETER,
            ACCEPT_LANGUAGE_HEADER,
        ],
        responses={
            200: OpenApiResponse(
                response=PostListSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
                examples=[POST_LIST_PLAIN_EXAMPLE, POST_LIST_EXPANDED_EXAMPLE],
            )
        },
    ),
    retrieve=extend_schema(
        parameters=[
            LANGUAGE_QUERY_PARAMETER,
            EXPAND_TRANSLATIONS_PARAMETER,
            ACCEPT_LANGUAGE_HEADER,
        ],
        responses={
            200: OpenApiResponse(
                response=PostDetailSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
                examples=[POST_DETAIL_PLAIN_EXAMPLE, POST_DETAIL_EXPANDED_EXAMPLE],
            )
        },
    ),
    create=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            201: OpenApiResponse(
                response=PostDetailSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            ),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        },
    ),
    update=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            200: OpenApiResponse(
                response=PostDetailSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            ),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        },
    ),
    partial_update=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            200: OpenApiResponse(
                response=PostDetailSerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            ),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        },
    ),
)
class PostViewSet(
    LanguageNegotiationMixin,
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
    filterset_class = PostFilterSet
    search_fields = [
        "translations__title",
        "translations__content",
        "tags__translations__name",
        "categories__translations__name",
    ]
    ordering_fields = ["date", "created_at", "title"]
    ordering = ["-date"]
    permission_classes = [IsAuthenticatedOrReadOnly, IsEditorOrAuthorCanEditOwnDraft]

    def get_permissions(self):  # type: ignore[override]
        """Customize permissions for auxiliary actions without tightening writes."""

        action = getattr(self, "action", None)
        if action == "react":
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

    def permission_denied(self, request, message=None, code=None):  # type: ignore[override]
        """Ensure unauthenticated users receive HTTP 401 instead of 403."""

        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            raise exceptions.NotAuthenticated(detail=message, code=code)
        return super().permission_denied(request, message=message, code=code)

    def get_throttles(self):  # type: ignore[override]
        if getattr(self, "action", None) in {"reactions", "react"}:
            self.throttle_scope = "reactions"
        else:
            self.throttle_scope = None
        return super().get_throttles()

    def get_queryset(self):
        queryset = super().get_queryset().distinct()

        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            queryset = queryset.filter(status__in=rbac.PUBLIC_POST_STATUSES)
        elif rbac.user_has_role(user, rbac.Role.ADMIN) or rbac.user_has_role(user, rbac.Role.EDITOR):
            pass
        elif rbac.user_has_role(user, rbac.Role.AUTHOR):
            queryset = queryset.filter(
                Q(created_by=user) | Q(status__in=rbac.PUBLIC_POST_STATUSES)
            )
        elif rbac.user_has_role(user, rbac.Role.REVIEWER):
            queryset = queryset.filter(status__in=rbac.REVIEWER_VISIBLE_STATUSES)
        else:
            queryset = queryset.filter(status__in=rbac.PUBLIC_POST_STATUSES)

        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(categories__slug__iexact=category_slug)

        return self.apply_language(queryset.distinct())

    def get_object(self):  # type: ignore[override]
        try:
            return super().get_object()
        except Http404:
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs.get(lookup_url_kwarg)

            if not lookup_value or self.lookup_field != "slug":
                raise

            base_queryset = self.filter_queryset(super().get_queryset()).distinct()

            translations_field = Post._meta.get_field("translations")
            translations_model = getattr(translations_field, "related_model", None)
            if translations_model is None:
                raise

            language_candidates: list[str] = []
            if self.language_code and self.language_code not in language_candidates:
                language_candidates.append(self.language_code)
            default_language = getattr(settings, "LANGUAGE_CODE", None)
            if default_language and default_language not in language_candidates:
                language_candidates.append(default_language)
            for code in LANGUAGE_CODES:
                if code not in language_candidates:
                    language_candidates.append(code)

            for language_code in language_candidates:
                with set_parler_language(language_code):
                    translation = (
                        translations_model._default_manager.filter(slug__iexact=lookup_value)
                        .order_by("master_id")
                        .first()
                    )
                if translation is None:
                    continue

                fallback = base_queryset.filter(pk=translation.master_id).first()
                if fallback is None:
                    fallback = (
                        super()
                        .get_queryset()
                        .filter(pk=translation.master_id)
                        .first()
                    )
                if fallback is None:
                    continue

                self.check_object_permissions(self.request, fallback)
                return fallback

            raise

    def filter_queryset(self, queryset):  # type: ignore[override]
        queryset = super().filter_queryset(queryset)
        search_term = (self.request.query_params.get("search") or "").strip()
        if search_term:
            queryset = queryset.filter(translations__language_code=self.language_code)
        return queryset.distinct()

    def get_serializer_class(self):  # type: ignore[override]
        if self.action == "list":
            return PostListSerializer
        return PostDetailSerializer


    @extend_schema(
        responses={
            201: OpenApiResponse(response=CommentSerializer, description="Comentario creado."),
            400: OpenApiResponse(description="Solicitud inválida."),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        }
    )
    def create(self, request, *args, **kwargs):  # type: ignore[override]
        return super().create(request, *args, **kwargs)

    @extend_schema(
        responses={
            204: OpenApiResponse(description="Comentario eliminado."),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        }
    )
    def destroy(self, request, *args, **kwargs):  # type: ignore[override]
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):  # type: ignore[override]
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            user = None
        serializer.save(created_by=user, modified_by=user)

    def perform_update(self, serializer):  # type: ignore[override]
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            user = None
        serializer.save(modified_by=user)

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


@extend_schema_view(
    list=extend_schema(
        parameters=[
            LANGUAGE_QUERY_PARAMETER,
            EXPAND_TRANSLATIONS_PARAMETER,
            ACCEPT_LANGUAGE_HEADER,
        ],
        responses={
            200: OpenApiResponse(
                response=CategorySerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    retrieve=extend_schema(
        parameters=[
            LANGUAGE_QUERY_PARAMETER,
            EXPAND_TRANSLATIONS_PARAMETER,
            ACCEPT_LANGUAGE_HEADER,
        ],
        responses={
            200: OpenApiResponse(
                response=CategorySerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    create=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            201: OpenApiResponse(
                response=CategorySerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    update=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            200: OpenApiResponse(
                response=CategorySerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
    partial_update=extend_schema(
        parameters=[LANGUAGE_QUERY_PARAMETER, ACCEPT_LANGUAGE_HEADER],
        responses={
            200: OpenApiResponse(
                response=CategorySerializer,
                description=TRANSLATED_RESPONSE_DESCRIPTION,
            )
        },
    ),
)
class CategoryViewSet(
    LanguageNegotiationMixin,
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
    permission_classes = [IsAdminOrEditorOrReadOnly]
    ordering = ["name"]

    def get_queryset(self):
        queryset = self.apply_language(Category.objects.all())
        params = self.request.query_params
        search_term = params.get("q")
        if search_term:
            search_term = search_term.strip()
            queryset = queryset.filter(
                Q(name__icontains=search_term)
                | Q(description__icontains=search_term)
            )
            queryset = queryset.filter(translations__language_code=self.language_code)

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


class CommentViewSet(
    LanguageNegotiationMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Manage comments nested under posts."""

    serializer_class = CommentSerializer
    permission_classes = [CanModerateComments]
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


    @extend_schema(
        responses={
            201: OpenApiResponse(response=CommentSerializer, description="Comentario creado."),
            400: OpenApiResponse(description="Solicitud inválida."),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        }
    )
    def create(self, request, *args, **kwargs):  # type: ignore[override]
        return super().create(request, *args, **kwargs)

    @extend_schema(
        responses={
            204: OpenApiResponse(description="Comentario eliminado."),
            401: OpenApiResponse(description="Autenticación requerida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        }
    )
    def destroy(self, request, *args, **kwargs):  # type: ignore[override]
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):  # type: ignore[override]
        serializer.save(post=self._get_post())





class MeView(APIView):
    """Return information about the authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: OpenApiResponse(response=MeSerializer, description="Perfil del usuario autenticado."),
            401: OpenApiResponse(description="Autenticación requerida."),
        }
    )
    def get(self, request):
        serializer = MeSerializer(request.user, context={"request": request})
        return Response(serializer.data)


class RoleManagementViewSet(viewsets.ViewSet):
    """Allow administrators to inspect and assign role groups."""

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        responses={
            200: OpenApiResponse(
                response={
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "label": {"type": "string"},
                            "permissions": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                    },
                },
                description="Listado de roles disponibles con sus permisos.",
            ),
            403: OpenApiResponse(description="Permisos insuficientes."),
        }
    )
    def list(self, request):
        data = [
            {
                "name": role,
                "label": rbac.ROLE_LABELS.get(role, role),
                "permissions": sorted(rbac.ROLE_PERMISSIONS.get(role, set())),
            }
            for role in rbac.ROLES
        ]
        return Response(data)

    @extend_schema(
        request=AssignRoleSerializer,
        responses={
            200: OpenApiResponse(
                response=MeSerializer,
                description="Roles asignados correctamente.",
            ),
            400: OpenApiResponse(description="Solicitud inválida."),
            403: OpenApiResponse(description="Permisos insuficientes."),
        },
    )
    def create(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        payload = MeSerializer(user, context={"request": request})
        return Response(payload.data)


@extend_schema(
    request=OpenAITranslationSerializer,
    responses={
        200: OpenApiResponse(
            response=OpenAITranslationResponseSerializer,
            description="Traducción generada correctamente.",
        ),
        400: OpenApiResponse(description="Solicitud inválida."),
        401: OpenApiResponse(description="Autenticación requerida."),
        502: OpenApiResponse(description="Error al contactar con OpenAI."),
        503: OpenApiResponse(description="Servicio de traducción no configurado."),
    },
    examples=[
        OPENAI_TRANSLATION_REQUEST_EXAMPLE,
        OPENAI_TRANSLATION_RESPONSE_EXAMPLE,
    ],
)
class OpenAITranslationViewSet(viewsets.ViewSet):
    """Proxy interno para solicitar traducciones a OpenAI."""

    permission_classes = [IsAuthenticatedOrReadOnly]
    throttle_scope = "openai"

    def create(self, request):  # type: ignore[override]
        serializer = OpenAITranslationSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticación requerida para solicitar traducciones."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = serializer.validated_data

        try:
            translation = translate_text(
                text=payload["text"],
                target_language=payload["target_lang"],
                source_language=payload.get("source_lang"),
                fmt=payload["format"],
            )
        except OpenAIConfigurationError as exc:
            logger.warning("OpenAI configuration error: %s", exc)
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except OpenAIRequestError as exc:
            detail = str(exc) or "No fue posible completar la traducción."
            status_code = exc.status_code or status.HTTP_502_BAD_GATEWAY
            if status_code < 400:
                status_code = status.HTTP_502_BAD_GATEWAY
            logger.warning(
                "OpenAI request failed with status %s: %s", status_code, detail
            )
            return Response({"detail": detail}, status=status_code)

        response_payload = {
            "translation": translation,
            "target_lang": payload["target_lang"],
            "source_lang": payload.get("source_lang"),
            "format": payload["format"],
        }
        output_serializer = OpenAITranslationResponseSerializer(response_payload)
        return Response(output_serializer.data, status=status.HTTP_200_OK)
