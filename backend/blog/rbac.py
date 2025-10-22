"""Centralized role and permission definitions for the blog RBAC layer."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Mapping

from django.contrib.auth.models import Group

APP_LABEL = "blog"


@dataclass(frozen=True)
class Role:
    """Enumeration of the supported high level roles."""

    ADMIN: str = "admin"
    EDITOR: str = "editor"
    AUTHOR: str = "author"
    REVIEWER: str = "reviewer"
    READER: str = "reader"


ROLES: tuple[str, ...] = (
    Role.ADMIN,
    Role.EDITOR,
    Role.AUTHOR,
    Role.REVIEWER,
    Role.READER,
)


ROLE_LABELS: Mapping[str, str] = {
    Role.ADMIN: "Administrador",
    Role.EDITOR: "Editor",
    Role.AUTHOR: "Autor",
    Role.REVIEWER: "Revisor",
    Role.READER: "Lector",
}


# Canonical codename definitions grouped by domain.
MODEL_PERMISSIONS: Mapping[str, tuple[str, ...]] = {
    "post": (
        "add_post",
        "change_post",
        "delete_post",
        "view_post",
        "can_approve_post",
        "can_publish_post",
    ),
    "category": (
        "add_category",
        "change_category",
        "delete_category",
        "view_category",
    ),
    "tag": (
        "add_tag",
        "change_tag",
        "delete_tag",
        "view_tag",
    ),
    "comment": (
        "add_comment",
        "change_comment",
        "delete_comment",
        "view_comment",
        "can_moderate_comment",
    ),
}

# Post status helpers exposed as strings to avoid circular imports with models.
POST_STATUS_DRAFT = "draft"
POST_STATUS_IN_REVIEW = "in_review"
POST_STATUS_PUBLISHED = "published"
POST_STATUS_ARCHIVED = "archived"

AUTHOR_EDITABLE_STATUSES = {POST_STATUS_DRAFT, POST_STATUS_IN_REVIEW}
PUBLIC_POST_STATUSES = {POST_STATUS_PUBLISHED}
REVIEWER_VISIBLE_STATUSES = {POST_STATUS_IN_REVIEW, POST_STATUS_PUBLISHED}


def _perm(*codenames: str) -> set[str]:
    return {f"{APP_LABEL}.{codename}" for codename in codenames}


ROLE_PERMISSIONS: Mapping[str, set[str]] = {
    Role.ADMIN: _perm(
        *MODEL_PERMISSIONS["post"],
        *MODEL_PERMISSIONS["category"],
        *MODEL_PERMISSIONS["tag"],
        *MODEL_PERMISSIONS["comment"],
    ),
    Role.EDITOR: _perm(
        "add_post",
        "change_post",
        "delete_post",
        "view_post",
        "can_approve_post",
        "can_publish_post",
        "add_category",
        "change_category",
        "view_category",
        "add_tag",
        "change_tag",
        "view_tag",
        "view_comment",
        "add_comment",
        "change_comment",
        "delete_comment",
        "can_moderate_comment",
    ),
    Role.AUTHOR: _perm(
        "add_post",
        "change_post",
        "delete_post",
        "view_post",
        "view_category",
        "view_tag",
        "view_comment",
        "add_comment",
    ),
    Role.REVIEWER: _perm(
        "view_post",
        "view_category",
        "view_tag",
        "view_comment",
        "add_comment",
    ),
    Role.READER: _perm(
        "view_post",
        "view_category",
        "view_tag",
        "view_comment",
        "add_comment",
    ),
}

ALL_PERMISSIONS: set[str] = set().union(*ROLE_PERMISSIONS.values())


def user_has_role(user, role: str) -> bool:
    """Return whether ``user`` belongs to the provided role name."""

    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_superuser", False):
        return True
    return user.groups.filter(name=role).exists()


def user_roles(user) -> set[str]:
    """Return all role names assigned to ``user`` respecting superuser bypass."""

    if not getattr(user, "is_authenticated", False):
        return set()
    if getattr(user, "is_superuser", False):
        return set(ROLES)
    return set(user.groups.values_list("name", flat=True))


def assign_roles(user, roles: Iterable[str]) -> None:
    """Assign the provided ``roles`` to ``user`` ensuring they exist."""

    valid_roles = {role for role in roles if role in ROLES}
    groups = Group.objects.filter(name__in=valid_roles)
    user.groups.set(groups)


def ensure_group_structure() -> None:
    """Create missing groups to simplify migrations and fixtures."""

    for role in ROLES:
        Group.objects.get_or_create(name=role)
