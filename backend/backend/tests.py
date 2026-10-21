import os
from unittest.mock import patch

from django.test import SimpleTestCase
from django.urls import reverse

from backend.images import optimized


class VersionViewTests(SimpleTestCase):
    def test_expone_el_commit_del_entorno(self):
        env = {"RENDER_GIT_COMMIT": "abcdef1234567890", "RENDER_GIT_BRANCH": "main"}
        with patch.dict(os.environ, env):
            res = self.client.get(reverse("version"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["commit"], "abcdef1234567890")
        self.assertEqual(res.json()["short"], "abcdef1")
        self.assertEqual(res.json()["branch"], "main")

    def test_usa_git_commit_como_fallback(self):
        with patch.dict(os.environ, {"GIT_COMMIT": "1234567"}):
            res = self.client.get(reverse("version"))
        self.assertEqual(res.json()["short"], "1234567")

    def test_sin_commit_devuelve_none(self):
        env = {"RENDER_GIT_COMMIT": "", "GIT_COMMIT": ""}
        with patch.dict(os.environ, env):
            res = self.client.get(reverse("version"))
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json()["commit"])
        self.assertIsNone(res.json()["short"])


class OptimizedUrlTests(SimpleTestCase):
    def test_inserta_transformacion_en_imagen_de_cloudinary(self):
        url = "https://res.cloudinary.com/demo/image/upload/v1/foto.jpg"
        self.assertEqual(
            optimized(url),
            "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/foto.jpg",
        )

    def test_no_duplica_la_transformacion(self):
        url = "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/foto.jpg"
        self.assertEqual(optimized(url), url)

    def test_ignora_urls_ajenas(self):
        url = "https://example.com/foto.jpg"
        self.assertEqual(optimized(url), url)

    def test_ignora_raw_y_video(self):
        for url in (
            "https://res.cloudinary.com/demo/raw/upload/v1/doc.pdf",
            "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4",
        ):
            self.assertEqual(optimized(url), url)

    def test_none_y_vacio(self):
        self.assertIsNone(optimized(None))
        self.assertEqual(optimized(""), "")
