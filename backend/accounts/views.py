"""Authentication API views."""
from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


@extend_schema(tags=["auth"])
class RegisterAPIView(generics.GenericAPIView):
    """Register a new user and return JWT tokens."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Registrar nuevo usuario",
        description="Crea una cuenta y devuelve los tokens JWT iniciales.",
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        self._send_welcome_email(user)
        return Response(serializer.to_representation(user), status=status.HTTP_201_CREATED)

    def _send_welcome_email(self, user) -> None:
        if not user.email:
            return
        subject = "Bienvenido a CodexTest"
        message = (
            "Hola {name},\n\n"
            "Gracias por registrarte en CodexTest. Ya puedes iniciar sesión con tus credenciales."
        ).format(name=user.get_full_name() or user.get_username())
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


@extend_schema(tags=["auth"])
class LoginAPIView(generics.GenericAPIView):
    """Issue JWT tokens after validating credentials."""

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Iniciar sesión", description="Devuelve tokens JWT válidos")
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@extend_schema(tags=["auth"])
class UserProfileAPIView(generics.RetrieveAPIView):
    """Return information about the currently authenticated user."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Perfil de usuario", description="Devuelve los datos del usuario autenticado")
    def get(self, request, *args, **kwargs):  # type: ignore[override]
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def get_object(self):  # type: ignore[override]
        return self.request.user
