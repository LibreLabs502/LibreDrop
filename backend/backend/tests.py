from django.test import SimpleTestCase

from backend.images import optimized


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
