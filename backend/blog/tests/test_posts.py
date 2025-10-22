"""API tests for the blog posts endpoints."""
from __future__ import annotations

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from blog.models import Category, Comment, Post, Tag


class PostAPITestCase(APITestCase):
    """Validate the main behaviours of the public post API."""

    def setUp(self) -> None:
        self.list_url = reverse("blog:posts-list")

    def _create_post(self, title: str, days_offset: int = 0) -> Post:
        tag = Tag.objects.create(name=f"Tag {title}")
        post = Post.objects.create(
            title=title,
            excerpt=f"Resumen de {title}",
            content=f"Contenido detallado de {title} " * 2,
            date=date.today() - timedelta(days=days_offset),
            image="https://example.com/image.png",
            thumb="https://example.com/thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
            status=Post.Status.PUBLISHED,
        )
        post.tags.add(tag)
        return post

    def _authenticate(self) -> None:
        """Authenticate the API client using a JWT token for a test user."""

        user_model = get_user_model()
        user = user_model.objects.create_superuser(
            username="editor",
            email="editor@example.com",
            password="test-pass-123",
        )
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    def _build_post_payload(self, **overrides) -> dict:
        """Return a valid payload for creating or updating a post."""

        base_payload = {
            "title": "Post actualizado",
            "excerpt": "Resumen actualizado",
            "content": "Contenido actualizado " * 5,
            "tags": ["python", "django"],
            "categories": [],
            "image": "https://example.com/new-image.png",
            "thumb": "https://example.com/new-thumb.png",
            "imageAlt": "Descripción alternativa",
            "author": "Equipo Codex",
            "date": date.today().isoformat(),
        }
        base_payload.update(overrides)
        return base_payload

    def test_list_returns_paginated_posts(self) -> None:
        """The list endpoint must return the stored posts with pagination metadata."""

        post = self._create_post("Hola mundo")

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        self.assertEqual(payload["count"], 1)
        self.assertIn("results", payload)
        result = payload["results"][0]
        self.assertEqual(result["title"], post.title)
        self.assertEqual(result["slug"], post.slug)
        self.assertIn("created_at", result)

    def test_retrieve_post_by_slug(self) -> None:
        """The detail endpoint should return a single post by slug."""

        post = self._create_post("Post detalle")
        url = reverse("blog:posts-detail", kwargs={"slug": post.slug})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], post.slug)
        self.assertEqual(response.data["title"], post.title)

    def test_retrieve_post_not_found(self) -> None:
        """Requesting a missing slug should respond with 404."""

        url = reverse("blog:posts-detail", kwargs={"slug": "missing"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_filters_posts(self) -> None:
        """Search parameter must filter posts by title or content."""

        self._create_post("Django avanzado")
        self._create_post("React hooks")

        response = self.client.get(self.list_url, {"search": "Django"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Django avanzado")

    def test_ordering_posts(self) -> None:
        """Ordering parameter must sort posts accordingly."""

        newer = self._create_post("Nuevo", days_offset=0)
        older = self._create_post("Antiguo", days_offset=10)

        response = self.client.get(self.list_url, {"ordering": "date"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(results[0]["slug"], older.slug)
        self.assertEqual(results[-1]["slug"], newer.slug)

    def test_ordering_posts_using_created_at_alias(self) -> None:
        """Ordering by the created_at alias should be accepted by the API."""

        newer = self._create_post("Más nuevo", days_offset=0)
        older = self._create_post("Más antiguo", days_offset=5)

        response = self.client.get(self.list_url, {"ordering": "created_at"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertGreaterEqual(len(results), 2)
        self.assertEqual(results[0]["slug"], older.slug)
        self.assertEqual(results[-1]["slug"], newer.slug)

    def test_post_detail_includes_category_metadata(self) -> None:
        """The post detail endpoint should expose category information safely."""

        post = self._create_post("Con categorías")
        category = Category.objects.create(name="Frontend")
        post.categories.add(category)

        url = reverse("blog:posts-detail", kwargs={"slug": post.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        self.assertIn("categories_detail", payload)
        self.assertIsInstance(payload["categories_detail"], list)
        detail = next(
            (item for item in payload["categories_detail"] if item.get("slug") == category.slug),
            None,
        )
        self.assertIsNotNone(detail)
        self.assertIn("post_count", detail)

    def test_post_detail_without_categories_returns_empty_arrays(self) -> None:
        """Posts without categories must expose empty lists in the payload."""

        post = self._create_post("Sin categorías")
        url = reverse("blog:posts-detail", kwargs={"slug": post.slug})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        self.assertIn("categories", payload)
        self.assertEqual(payload["categories"], [])
        self.assertIn("categories_detail", payload)
        self.assertEqual(payload["categories_detail"], [])

    def test_update_post_requires_authentication(self) -> None:
        """Updating a post without credentials should return 401."""

        post = self._create_post("Privado")
        url = reverse("blog:posts-detail", kwargs={"slug": post.slug})
        payload = self._build_post_payload()

        response = self.client.put(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_update_post(self) -> None:
        """An authenticated user should be able to update post content."""

        post = self._create_post("Editable")
        category = Category.objects.create(name="Backend")
        url = reverse("blog:posts-detail", kwargs={"slug": post.slug})
        payload = self._build_post_payload(categories=[category.slug])
        self._authenticate()

        response = self.client.put(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        post.refresh_from_db()
        self.assertEqual(post.title, payload["title"])
        self.assertEqual(post.excerpt, payload["excerpt"])
        self.assertTrue(post.tags.filter(name="python").exists())
        self.assertEqual(list(post.categories.values_list("slug", flat=True)), [category.slug])

    def test_authenticated_user_can_delete_post(self) -> None:
        """Authenticated users must be able to delete posts."""

        post = self._create_post("Eliminable")
        url = reverse("blog:posts-detail", kwargs={"slug": post.slug})
        self._authenticate()

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(pk=post.pk).exists())


class CommentAPITestCase(APITestCase):
    """Validate nested comment behaviour."""

    def setUp(self) -> None:
        self.post = Post.objects.create(
            title="Post con comentarios",
            excerpt="Resumen",
            content="Contenido muy largo " * 2,
            date=date.today(),
            image="https://example.com/post.png",
            thumb="https://example.com/post-thumb.png",
            imageAlt="Alt",
            author="Codex",
            status=Post.Status.PUBLISHED,
        )
        self.post.tags.add(Tag.objects.create(name="Testing"))
        self.user = get_user_model().objects.create_superuser(
            username="commenter",
            email="commenter@example.com",
            password="test-pass-123",
        )
        self.comments_url = reverse("blog:post-comments-list", kwargs={"slug_pk": self.post.slug})

    def test_list_comments_for_post(self) -> None:
        """Comments endpoint must filter by parent post slug."""

        Comment.objects.create(post=self.post, author_name="Ana", content="Excelente artículo")
        other_post = Post.objects.create(
            title="Otro post",
            excerpt="Otro resumen",
            content="Otro contenido " * 2,
            date=date.today(),
            image="https://example.com/other.png",
            thumb="https://example.com/other-thumb.png",
            imageAlt="Alt",
            author="Codex",
        )
        other_post.tags.add(Tag.objects.create(name="Extra"))
        Comment.objects.create(post=other_post, author_name="Luis", content="No debería verse")

        response = self.client.get(self.comments_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["author_name"], "Ana")

    def test_create_comment_success(self) -> None:
        """Posting a valid comment should return 201 and persist the object."""

        payload = {"author_name": "Carlos", "content": "Gran post, gracias!"}

        self.client.force_authenticate(self.user)
        response = self.client.post(self.comments_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Comment.objects.filter(post=self.post, author_name="Carlos").exists())

    def test_create_comment_validation_error(self) -> None:
        """Invalid payload must return 400 with details."""

        payload = {"author_name": "", "content": "Hola"}

        self.client.force_authenticate(self.user)
        response = self.client.post(self.comments_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("author_name", response.data)

    def test_list_comments_using_plain_url(self) -> None:
        """The API must accept plain nested URLs without reversing helpers."""

        Comment.objects.create(post=self.post, author_name="Ana", content="Excelente artículo")

        response = self.client.get(f"/api/posts/{self.post.slug}/comments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_create_comment_using_plain_url(self) -> None:
        """Posting through the public URL should create the comment successfully."""

        payload = {"author_name": "Laura", "content": "Me encantó este contenido"}

        self.client.force_authenticate(self.user)
        response = self.client.post(
            f"/api/posts/{self.post.slug}/comments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Comment.objects.filter(post=self.post, author_name="Laura").exists())

    def test_duplicate_title_creates_incremental_slug(self) -> None:
        """Posts that share the same title must generate unique slugs."""

        first_post = Post.objects.create(
            title="Título duplicado",
            excerpt="Resumen",
            content="Contenido " * 2,
            date=date.today(),
            image="https://example.com/post.png",
            thumb="https://example.com/post-thumb.png",
            imageAlt="Alt",
            author="Codex",
        )
        first_post.tags.add(Tag.objects.create(name="Duplicado base"))

        duplicate_post = Post.objects.create(
            title="Título duplicado",
            excerpt="Resumen",
            content="Contenido " * 2,
            date=date.today(),
            image="https://example.com/post-2.png",
            thumb="https://example.com/post-thumb-2.png",
            imageAlt="Alt",
            author="Codex",
        )
        duplicate_post.tags.add(Tag.objects.create(name="Duplicado extra"))

        self.assertEqual(first_post.slug, "titulo-duplicado")
        self.assertEqual(duplicate_post.slug, "titulo-duplicado-2")
