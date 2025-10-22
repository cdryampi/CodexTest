"""Seed command that creates the default RBAC roles and permissions."""
from __future__ import annotations

from collections import defaultdict

from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

from blog import rbac


class Command(BaseCommand):
    help = "Create or update the RBAC role groups with their permissions."

    def handle(self, *args, **options):
        missing: dict[str, list[str]] = defaultdict(list)

        for role, permissions in rbac.ROLE_PERMISSIONS.items():
            group, created = Group.objects.get_or_create(name=role)
            assigned_permissions: list[Permission] = []

            for permission_codename in sorted(permissions):
                try:
                    app_label, codename = permission_codename.split(".", 1)
                except ValueError:
                    missing[role].append(permission_codename)
                    continue

                permission = Permission.objects.filter(
                    content_type__app_label=app_label,
                    codename=codename,
                ).first()
                if permission is None:
                    missing[role].append(permission_codename)
                    continue

                assigned_permissions.append(permission)

            group.permissions.set(assigned_permissions)
            group.save(update_fields=["name"])

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role group '{role}'."))
            else:
                self.stdout.write(self.style.NOTICE(f"Updated role group '{role}'."))

        if missing:
            self.stdout.write(self.style.WARNING("Some permissions were not found:"))
            for role, perms in sorted(missing.items()):
                for perm in perms:
                    self.stdout.write(f" - {role}: {perm}")
        else:
            self.stdout.write(self.style.SUCCESS("Roles seeded successfully."))
