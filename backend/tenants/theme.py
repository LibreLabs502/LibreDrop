"""Paletas de color por tienda y validación de colores.

Este módulo es la **única** definición de las paletas predefinidas: el backend
la expone por API (`/tenants/palettes/`) y resuelve los colores guardados en
cada `Tenant`, de modo que frontend y backend trabajen con los mismos valores.
"""

import re

from django.core.exceptions import ValidationError

# Solo se aceptan colores hexadecimales tipo #2563EB (6 dígitos) o #FFF (3).
HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


def validate_hex_color(value):
    """Valida un color hexadecimal y lo normaliza a mayúsculas."""
    if not isinstance(value, str) or not HEX_COLOR_RE.match(value):
        raise ValidationError(
            "Color inválido. Usá formato hexadecimal, por ejemplo #2563EB."
        )
    return value.upper()


# Paletas iniciales. La clave es estable (API) y `label` es el nombre visible.
PALETTES = {
    "blue": {
        "label": "Azul",
        "primary": "#2563EB",
        "secondary": "#DBEAFE",
        "background": "#F6F7F9",
        "text": "#1F2430",
    },
    "pink": {
        "label": "Rosa",
        "primary": "#D98C9B",
        "secondary": "#F5E6E8",
        "background": "#FBF7F8",
        "text": "#3B2127",
    },
    "green": {
        "label": "Verde",
        "primary": "#15803D",
        "secondary": "#DCFCE7",
        "background": "#F4FBF6",
        "text": "#14261A",
    },
    "purple": {
        "label": "Morado",
        "primary": "#7C3AED",
        "secondary": "#EDE9FE",
        "background": "#F7F5FE",
        "text": "#221A38",
    },
    "brown": {
        "label": "Café",
        "primary": "#8B5E3C",
        "secondary": "#F5EBDD",
        "background": "#FAF6F1",
        "text": "#2E2118",
    },
    "dark": {
        "label": "Oscuro",
        "primary": "#8B5CF6",
        "secondary": "#27272A",
        "background": "#18181B",
        "text": "#F4F4F5",
    },
}

# El azul es el tema predeterminado y no cambia la apariencia de las tiendas
# que ya existían.
DEFAULT_PALETTE_KEY = "blue"
DEFAULT_PALETTE = PALETTES[DEFAULT_PALETTE_KEY]


def palette_choices():
    """Choices (clave, etiqueta) para serializers y formularios."""
    return [(key, spec["label"]) for key, spec in PALETTES.items()]


def palette_catalog():
    """Lista de paletas disponible para el selector del panel."""
    return [{"key": key, **spec} for key, spec in PALETTES.items()]


def match_palette_key(primary, secondary):
    """Devuelve la clave de la paleta que coincide, o None si es personalizada."""
    for key, spec in PALETTES.items():
        if (
            spec["primary"].lower() == str(primary or "").lower()
            and spec["secondary"].lower() == str(secondary or "").lower()
        ):
            return key
    return None


def theme_payload(tenant):
    """Representación pública de la configuración visual de una tienda.

    No incluye datos privados: solo colores y la clave de paleta detectada.
    """
    return {
        "palette": match_palette_key(tenant.theme_primary, tenant.theme_secondary),
        "primary": tenant.theme_primary,
        "secondary": tenant.theme_secondary,
        "background": tenant.theme_background,
        "text": tenant.theme_text,
    }
