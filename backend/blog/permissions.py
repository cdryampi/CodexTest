"""Permission classes enforcing the RBAC contract for the blog API."""
from __future__ import annotations

from typing import Any

from rest_framework.permissions import SAFE_METHODS, BasePermission

from . import rbac


class AllowReadOnly(BasePermission):
    """Allow any read-only request while denying write attempts."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return request.method in SAFE_METHODS


class IsAdmin(BasePermission):
    """Grant access only to authenticated administrators."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        user = getattr(request, "user", None)
        return bool(user and rbac.user_has_role(user, rbac.Role.ADMIN))

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        return self.has_permission(request, view)


class IsAdminOrReadOnly(BasePermission):
    """Allow read-only access for everyone while restricting writes to admins."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        user = getattr(request, "user", None)
        return bool(user and rbac.user_has_role(user, rbac.Role.ADMIN))

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return self.has_permission(request, view)


class IsAdminOrEditorOrReadOnly(BasePermission):
    """Grant write access to administrators and editors while keeping reads public."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        return rbac.user_has_role(user, rbac.Role.ADMIN) or rbac.user_has_role(
            user, rbac.Role.EDITOR
        )

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return self.has_permission(request, view)


class IsEditorOrAuthorCanEditOwnDraft(BasePermission):
    """Guard post operations according to role and ownership rules."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        if rbac.user_has_role(user, rbac.Role.ADMIN) or rbac.user_has_role(
            user, rbac.Role.EDITOR
        ):
            return True

        if request.method == "POST" and rbac.user_has_role(user, rbac.Role.AUTHOR):
            return True

        # For other unsafe methods defer to object level evaluation.
        return request.method in {"PUT", "PATCH", "DELETE"}

    def has_object_permission(self, request, view, obj: Any) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        if rbac.user_has_role(user, rbac.Role.ADMIN) or rbac.user_has_role(
            user, rbac.Role.EDITOR
        ):
            return True

        if not rbac.user_has_role(user, rbac.Role.AUTHOR):
            return False

        author_status_allows = getattr(obj, "status", None) in rbac.AUTHOR_EDITABLE_STATUSES
        owns_post = getattr(obj, "created_by_id", None) == getattr(user, "id", None)
        return author_status_allows and owns_post


class CanModerateComments(BasePermission):
    """Permit creating comments to allowed roles and moderation to editors/admins."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        if request.method == "POST":
            return user.has_perm("blog.add_comment")

        return user.has_perm("blog.can_moderate_comment") or rbac.user_has_role(
            user, rbac.Role.ADMIN
        )

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return self.has_permission(request, view)
