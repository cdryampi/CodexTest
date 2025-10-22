"""RBAC integration tests covering role-based permissions."""
from __future__ import annotations

from datetime import date

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from blog import rbac
from blog.models import Comment, Post, Tag


class RBACMixin:
    @classmethod
    def setUpTestData(cls):  # type: ignore[override]
        call_command("seed_roles")
        cls.user_model = get_user_model()

    def create_user_with_role(self, username: str, role: str, **extra):
        password = extra.pop("password", "test-pass-123")
        user = self.user_model.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password=password,
            **extra,
        )
        rbac.assign_roles(user, [role])
        return user

    def post_payload(self, **overrides) -> dict:
        payload = {
            "title": "Nuevo post de prueba",
            "excerpt": "Resumen del post",
            "content": "Contenido extenso " * 3,
            "tags": ["python", "django"],
            "categories": [],
            "image": "https://example.com/image.png",
            "thumb": "https://example.com/thumb.png",
            "imageAlt": "Texto alternativo",
            "author": "Equipo Codex",
            "date": date.today().isoformat(),
        }
        payload.update(overrides)
        return payload

    def create_post_object(self, title: str, created_by=None, status_value: str = Post.Status.PUBLISHED) -> Post:
        tag = Tag.objects.create(name=f"{title}-tag")
        post = Post.objects.create(
            title=title,
            excerpt=f"Resumen de {title}",
            content=f"Contenido de {title} " * 3,
            date=date.today(),
            image="https://example.com/post.png",
            thumb="https://example.com/post-thumb.png",
            imageAlt="Texto alternativo",
            author="Codex",
            status=status_value,
            created_by=created_by,
            modified_by=created_by,
        )
        post.tags.add(tag)
        return post


class AuthorPermissionsTestCase(RBACMixin, APITestCase):
    """Validate author capabilities with ownership restrictions."""

    def setUp(self) -> None:
        super().setUp()
        self.author = self.create_user_with_role("author-user", rbac.Role.AUTHOR)
        self.editor = self.create_user_with_role("editor-user", rbac.Role.EDITOR)
        self.other_post = self.create_post_object("Publicable", created_by=self.editor)
        self.posts_url = reverse("blog:posts-list")

    def test_author_can_manage_own_drafts_only(self) -> None:
        self.client.force_authenticate(self.author)
        create_payload = self.post_payload(status=Post.Status.DRAFT)
        response = self.client.post(self.posts_url, create_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post_slug = response.data["slug"]

        detail_url = reverse("blog:posts-detail", kwargs={"slug": post_slug})
        patch_response = self.client.patch(
            detail_url,
            {"status": Post.Status.IN_REVIEW, "title": "Post actualizado"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["status"], Post.Status.IN_REVIEW)

        # Attempt to update after publication should be rejected.
        post = Post.objects.get(slug=post_slug)
        post.status = Post.Status.PUBLISHED
        post.save(update_fields=["status"])

        forbidden_response = self.client.patch(
            detail_url,
            {"title": "Cambio no permitido"},
            format="json",
        )
        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

        # Editing someone else's post is forbidden regardless of status.
        other_url = reverse("blog:posts-detail", kwargs={"slug": self.other_post.slug})
        other_response = self.client.patch(
            other_url,
            {"title": "Intento fallido"},
            format="json",
        )
        self.assertEqual(other_response.status_code, status.HTTP_403_FORBIDDEN)


class EditorPermissionsTestCase(RBACMixin, APITestCase):
    """Editors can manage any post and moderate comments."""

    def setUp(self) -> None:
        super().setUp()
        self.editor = self.create_user_with_role("main-editor", rbac.Role.EDITOR)
        self.author = self.create_user_with_role("other-author", rbac.Role.AUTHOR)
        self.target_post = self.create_post_object("Editable", created_by=self.author, status_value=Post.Status.IN_REVIEW)
        self.post_detail = reverse("blog:posts-detail", kwargs={"slug": self.target_post.slug})
        self.comments_url = reverse(
            "blog:post-comments-list", kwargs={"slug_pk": self.target_post.slug}
        )

    def test_editor_can_edit_any_post_and_moderate_comments(self) -> None:
        self.client.force_authenticate(self.editor)

        update_response = self.client.patch(
            self.post_detail,
            {"excerpt": "Resumen modificado", "status": Post.Status.PUBLISHED},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["status"], Post.Status.PUBLISHED)

        comment = Comment.objects.create(
            post=self.target_post,
            author_name="Lector",
            content="Comentario a moderar",
        )

        delete_url = reverse(
            "blog:post-comments-detail",
            kwargs={"slug_pk": self.target_post.slug, "pk": comment.pk},
        )
        delete_response = self.client.delete(delete_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(pk=comment.pk).exists())


class ReaderPermissionsTestCase(RBACMixin, APITestCase):
    """Readers can only access read operations but may comment."""

    def setUp(self) -> None:
        super().setUp()
        self.reader = self.create_user_with_role("reader-user", rbac.Role.READER)
        self.posts_url = reverse("blog:posts-list")
        self.create_post_object("Visible", status_value=Post.Status.PUBLISHED)

    def test_reader_cannot_create_posts_but_can_view(self) -> None:
        self.client.force_authenticate(self.reader)
        create_response = self.client.post(self.posts_url, self.post_payload(), format="json")
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

        list_response = self.client.get(self.posts_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(list_response.data["count"], 1)


class AuxiliaryEndpointsTestCase(RBACMixin, APITestCase):
    """Ensure auxiliary endpoints expose role metadata properly."""

    def setUp(self) -> None:
        super().setUp()
        self.admin = self.create_user_with_role("admin-user", rbac.Role.ADMIN, is_superuser=True, is_staff=True)
        self.editor = self.create_user_with_role("aux-editor", rbac.Role.EDITOR)

    def test_me_endpoint_returns_roles_and_permissions(self) -> None:
        self.client.force_authenticate(self.editor)
        response = self.client.get(reverse("blog:me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(rbac.Role.EDITOR, response.data["roles"])
        self.assertIn("blog.change_post", response.data["permissions"])

    def test_roles_endpoint_requires_admin(self) -> None:
        self.client.force_authenticate(self.editor)
        forbidden = self.client.get(reverse("blog:roles"))
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin)
        allowed = self.client.get(reverse("blog:roles"))
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(allowed.data), len(rbac.ROLES))

    def test_admin_can_assign_roles(self) -> None:
        self.client.force_authenticate(self.admin)
        payload = {"user_id": self.editor.id, "roles": [rbac.Role.READER]}
        response = self.client.post(reverse("blog:roles"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["roles"], [rbac.Role.READER])


class AuditFieldsTestCase(RBACMixin, APITestCase):
    """Validate that created_by and modified_by are tracked automatically."""

    def setUp(self) -> None:
        super().setUp()
        self.author = self.create_user_with_role("audit-author", rbac.Role.AUTHOR)
        self.editor = self.create_user_with_role("audit-editor", rbac.Role.EDITOR)
        self.posts_url = reverse("blog:posts-list")

    def test_created_and_modified_metadata(self) -> None:
        self.client.force_authenticate(self.author)
        create_response = self.client.post(
            self.posts_url,
            self.post_payload(status=Post.Status.DRAFT),
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created_slug = create_response.data["slug"]
        self.assertEqual(create_response.data["created_by"]["username"], self.author.username)

        detail_url = reverse("blog:posts-detail", kwargs={"slug": created_slug})
        self.client.force_authenticate(self.editor)
        update_response = self.client.patch(
            detail_url,
            {"status": Post.Status.PUBLISHED},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["modified_by"]["username"], self.editor.username)
