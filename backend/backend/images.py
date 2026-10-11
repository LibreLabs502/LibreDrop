"""Helpers para la entrega de imágenes de Cloudinary.

Cloudinary sirve el archivo original salvo que se le pida una transformación
en la URL de entrega. ``f_auto`` entrega WebP/AVIF al navegador que lo soporte
(y el original al que no) y ``q_auto`` aplica calidad automática, sin
re-comprimir ni volver a subir nada.
"""

DEFAULT_TRANSFORM = "f_auto,q_auto"


def optimized(url, transform=DEFAULT_TRANSFORM):
    """Inserta la transformación justo después de ``/image/upload/`` en una URL
    de Cloudinary. Si la URL no es de una imagen de Cloudinary o ya tiene la
    transformación, se devuelve sin cambios."""
    if not url:
        return url
    marker = "/image/upload/"
    if marker not in url or transform in url:
        return url
    return url.replace(marker, f"{marker}{transform}/", 1)
