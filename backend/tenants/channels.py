"""Canales de compra por tienda.

Este módulo es la **única** definición de los canales por los que una tienda
puede recibir pedidos. El backend lo usa para validar qué canales puede activar
cada negocio; el panel (frontend) muestra las mismas etiquetas.

LinkedIn queda fuera a propósito: es una red de contacto, no un canal de compra,
y conserva su comportamiento actual (solo aparece como enlace en la tienda).
"""

from urllib.parse import urlparse

# Orden en el que se muestran y en el que se normaliza la selección guardada.
PURCHASE_CHANNELS = {
    "whatsapp": {
        "label": "WhatsApp",
        "field": "whatsapp",
        "hint": "el número de WhatsApp",
    },
    "instagram": {
        "label": "Instagram",
        "field": "instagram_url",
        "hint": "el enlace de Instagram",
    },
    "facebook": {
        "label": "Facebook",
        "field": "facebook_url",
        "hint": "el enlace de Facebook",
    },
    "tiktok": {
        "label": "TikTok",
        "field": "tiktok_url",
        "hint": "el enlace de TikTok",
    },
}

CHANNEL_KEYS = tuple(PURCHASE_CHANNELS)


def normalize_channels(values):
    """Deja solo canales conocidos, sin repetir y en el orden canónico."""
    if not values:
        return []
    selected = set()
    for value in values:
        if isinstance(value, str) and value:
            selected.add(value)
    return [key for key in CHANNEL_KEYS if key in selected]


def _whatsapp_digits(value):
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def is_valid_destination(channel, value):
    """¿El canal puede generar un enlace de destino válido?

    WhatsApp necesita dígitos (el resto lo arma `wa.me`). Las redes necesitan
    una URL http(s) completa, que es lo que guarda cada campo `*_url`.
    """
    if channel not in PURCHASE_CHANNELS:
        return False
    if channel == "whatsapp":
        return bool(_whatsapp_digits(value))
    url = str(value or "").strip()
    if not url:
        return False
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def effective_channels(tenant):
    """Canales activados por la tienda que además tienen un destino válido.

    Es lo que se muestra en la tienda pública: nunca exponemos un canal sin
    enlace, aunque haya quedado seleccionado tras cambiar sus datos.
    """
    saved = normalize_channels(tenant.purchase_channels or [])
    return [
        key
        for key in saved
        if is_valid_destination(key, getattr(tenant, PURCHASE_CHANNELS[key]["field"], None))
    ]
