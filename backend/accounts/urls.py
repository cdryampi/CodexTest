"""URL configuration for authentication endpoints."""
from __future__ import annotations

from django.urls import path

from .views import LoginAPIView, RegisterAPIView, UserProfileAPIView

app_name = "accounts"

urlpatterns = [
    path("registration/", RegisterAPIView.as_view(), name="registration"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("user/", UserProfileAPIView.as_view(), name="user"),
]
