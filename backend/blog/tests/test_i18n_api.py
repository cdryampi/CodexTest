"""Integration tests covering the translated API responses."""
from __future__ import annotations

from datetime import date

from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from parler.utils.context import switch_language
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import Post, Tag


class BaseI18nAPITestCase(APITestCase):
    """Shared helpers for i18n API tests."""

    def setUp(self) -> None:
        super().setUp()
        self.list_url = reverse("blog:posts-list")

    def _create_translated_post(
        self,
        es_title: str,
        *,
        en_title: str | None = None,
        en_excerpt: str | None = None,
        en_content: str | None = None,
    ) -> Post:
        tag = Tag.objects.create(name=f"Tag {es_title}")
        post = Post.objects.create(
            title=es_title,
            excerpt=f"Resumen {es_title}",
            content=f"Contenido {es_title}",
            image="https://example.com/image.png",
            thumb="https://example.com/thumb.png",
            imageAlt=f"Alt {es_title}",
            author="Codex",
        )
        post.tags.add(tag)
        if en_title:
            with switch_language(post, "en"):
                post.title = en_title
                post.excerpt = en_excerpt or f"Summary {en_title}"
                post.content = en_content or f"Content {en_title}"
                post.slug = ""
                post.save()
        return post

    def _authenticate(self) -> None:
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username="translator",
            email="translator@example.com",
            password="pass-1234",
        )
        self.client.force_authenticate(user=user)

    def _build_payload(self, **overrides) -> dict:
        payload = {
            "title": "English title",
            "excerpt": "English excerpt",
            "content": "English content body" * 2,
            "tags": ["django", "i18n"],
            "categories": [],
            "image": "https://example.com/img.png",
            "thumb": "https://example.com/thumb.png",
            "imageAlt": "Alt text",
            "author": "Codex",
            "date": date.today().isoformat(),
        }
        payload.update(overrides)
        return payload


class AAI18nFallbackAPITestCase(BaseI18nAPITestCase):
    """Dedicated suite to validate fallback behaviour without cross-test state."""

    def test_detail_falls_back_to_default_language(self) -> None:
        """Requests without translation must return the default content."""

        Post.objects.all().delete()
        Tag.objects.all().delete()
        post = self._create_translated_post("Solo fallback")
        post.translations.filter(language_code="en").delete()
        post.set_current_language(settings.LANGUAGE_CODE)
        es_slug = post.safe_translation_getter("slug", language_code=settings.LANGUAGE_CODE)

        url = reverse("blog:posts-detail", kwargs={"slug": es_slug})
        response = self.client.get(f"{url}?lang=en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Language"], "en")
        self.assertEqual(response.data["title"], "Solo fallback")
        self.assertEqual(response.data["slug"], es_slug)


class I18nAPITestCase(BaseI18nAPITestCase):
    """Ensure the API serves and accepts localized content."""

    def test_list_uses_requested_language(self) -> None:
        """`?lang=` should activate the chosen translation for list responses."""

        post = self._create_translated_post(
            "Entrada ES",
            en_title="English Entry",
            en_excerpt="English summary",
        )

        response = self.client.get(self.list_url, {"lang": "en"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Language"], "en")
        payload = response.data["results"][0]
        self.assertEqual(payload["title"], "English Entry")
        self.assertEqual(payload["excerpt"], "English summary")
        self.assertNotIn("translations", payload)

        # Fallback: the same request should return Spanish when the translation is missing
        spanish_only = self._create_translated_post("Solo español")
        fallback_response = self.client.get(self.list_url, {"lang": "en"})
        self.assertEqual(fallback_response.status_code, status.HTTP_200_OK)
        titles = {item["title"] for item in fallback_response.data["results"]}
        self.assertIn(spanish_only.title, titles)

    def test_detail_expanded_translations(self) -> None:
        """`?expand=translations` should expose all language variants."""

        post = self._create_translated_post(
            "Entrada ES",
            en_title="English Entry",
            en_excerpt="English summary",
            en_content="English content",
        )
        es_slug = post.safe_translation_getter("slug", language_code=settings.LANGUAGE_CODE)
        en_slug = post.safe_translation_getter("slug", language_code="en")
        url = reverse("blog:posts-detail", kwargs={"slug": en_slug})

        response = self.client.get(
            url,
            {"lang": "en", "expand": "translations=true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Language"], "en")
        payload = response.data
        self.assertIn("translations", payload)
        translations = payload["translations"]
        self.assertIn("es", translations)
        self.assertIn("en", translations)
        self.assertEqual(translations["en"]["title"], "English Entry")
        self.assertEqual(translations["es"]["title"], "Entrada ES")

    def test_list_expand_translations(self) -> None:
        """`expand=translations` should include the translation map in collection responses."""

        self._create_translated_post("Entrada ES", en_title="English Entry")

        response = self.client.get(self.list_url, {"lang": "en", "expand": "translations"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first_result = response.data["results"][0]
        self.assertIn("translations", first_result)
        self.assertIn("en", first_result["translations"])

    def test_create_translation_with_content_language_header(self) -> None:
        """POST requests should persist fields in the declared language."""

        self._authenticate()
        payload = self._build_payload()

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
            HTTP_CONTENT_LANGUAGE="en",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response["Content-Language"], "en")
        created_slug = response.data["slug"]
        stored = Post.objects.language("en").get(slug=created_slug)
        self.assertEqual(stored.safe_translation_getter("title", language_code="en"), payload["title"])

    def test_update_translation_with_lang_parameter(self) -> None:
        """PUT requests using `?lang=` must update that translation without touching the default."""

        post = self._create_translated_post("Entrada ES")
        url = reverse("blog:posts-detail", kwargs={"slug": post.safe_translation_getter("slug")})
        self._authenticate()

        update_payload = self._build_payload(title="Updated EN", excerpt="Updated excerpt")

        response = self.client.put(
            f"{url}?lang=en",
            update_payload,
            format="json",
        )

        if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            self.fail("Expected PUT to be enabled for the post endpoint")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Language"], "en")
        post.refresh_from_db()
        with switch_language(post, "en"):
            self.assertEqual(post.title, "Updated EN")
            self.assertEqual(post.excerpt, "Updated excerpt")
        with switch_language(post, "es"):
            self.assertEqual(post.title, "Entrada ES")

    def test_search_filters_in_active_language(self) -> None:
        """Search queries should target the translation requested by the client."""

        self._create_translated_post("Entrada ES", en_title="React in depth")
        self._create_translated_post("Otra entrada", en_title="Backend tips")

        response = self.client.get(self.list_url, {"lang": "en", "search": "React"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "React in depth")


