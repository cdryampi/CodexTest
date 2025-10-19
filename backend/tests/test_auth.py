from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthEndpointsTests(TestCase):
    """Pruebas mínimas de registro, login y perfil con JWT."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.registration_url = "/api/auth/registration/"
        self.login_url = "/api/auth/login/"
        self.profile_url = "/api/auth/user/"
        self.password = "ClaveSegura123!"
        self.email = "tester@example.com"
        self.username = "tester"

    def test_registration_creates_user_and_sends_welcome_email(self) -> None:
        response = self.client.post(
            self.registration_url,
            {
                "username": self.username,
                "email": self.email,
                "password1": self.password,
                "password2": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(get_user_model().objects.filter(email=self.email).exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Bienvenido", mail.outbox[0].subject)

    def test_login_returns_access_and_refresh_tokens(self) -> None:
        get_user_model().objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password,
        )

        response = self.client.post(
            self.login_url,
            {"email": self.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertNotEqual(response.data["access"], "")
        self.assertNotEqual(response.data["refresh"], "")

    def test_profile_requires_valid_bearer_token(self) -> None:
        get_user_model().objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password,
        )

        login_response = self.client.post(
            self.login_url,
            {"email": self.email, "password": self.password},
            format="json",
        )
        access_token = login_response.data["access"]

        profile_response = self.client.get(
            self.profile_url,
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data.get("email"), self.email)
        self.assertEqual(profile_response.data.get("username"), self.username)
