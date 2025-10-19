"""Serializers powering the authentication API."""
from __future__ import annotations

from typing import Any

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public representation for authenticated users."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Handle user creation with password validation."""

    password1 = serializers.CharField(write_only=True, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password1",
            "password2",
        ]

    default_error_messages = {
        "password_mismatch": _("Las contraseñas no coinciden."),
        "invalid_credentials": _("No se pudieron validar las credenciales."),
    }

    def validate_email(self, value: str) -> str:
        """Ensure the email address is unique."""

        value = value.strip()
        if not value:
            raise serializers.ValidationError(_("El correo electrónico es obligatorio."))
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(_("Ya existe un usuario con este correo."))
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        password1 = attrs.get("password1")
        password2 = attrs.get("password2")

        if password1 != password2:
            self.fail("password_mismatch")

        temp_user = User(
            username=attrs.get("username"),
            email=attrs.get("email"),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        validate_password(password1, user=temp_user)
        return attrs

    def create(self, validated_data: dict[str, Any]) -> User:
        password = validated_data.pop("password1")
        validated_data.pop("password2", None)
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def to_representation(self, instance: User) -> dict[str, Any]:
        """Include JWT tokens alongside the public user data."""

        refresh = RefreshToken.for_user(instance)
        return {
            "user": UserSerializer(instance).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class LoginSerializer(serializers.Serializer):
    """Authenticate using username or email and return JWT tokens."""

    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    default_error_messages = {
        "invalid_credentials": _("Credenciales inválidas."),
        "inactive": _("La cuenta está inactiva."),
    }

    def _authenticate_with_identifier(self, *, identifier: str, password: str) -> User | None:
        """Try authenticating with either username or email."""

        request = self.context.get("request")
        user = authenticate(request=request, username=identifier, password=password)
        if user is not None:
            return user
        try:
            user_obj = User.objects.get(email__iexact=identifier)
        except User.DoesNotExist:
            return None
        return authenticate(request=request, username=user_obj.get_username(), password=password)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        password = attrs.get("password")
        identifier = attrs.get("username") or attrs.get("email")

        if not identifier or not password:
            raise serializers.ValidationError(self.error_messages["invalid_credentials"])

        user = self._authenticate_with_identifier(identifier=identifier, password=password)

        if user is None:
            raise serializers.ValidationError(self.error_messages["invalid_credentials"])

        if not user.is_active:
            raise serializers.ValidationError(self.error_messages["inactive"])

        refresh = RefreshToken.for_user(user)
        return {
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
