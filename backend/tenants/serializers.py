from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from accounts.serializers import UserSerializer
from backend.images import optimized
from .channels import (
    CHANNEL_KEYS,
    PURCHASE_CHANNELS,
    is_valid_destination,
    normalize_channels,
)
from .models import Tenant, Membership
from .services import subscription_payload
from .theme import PALETTES, palette_choices, theme_payload, validate_hex_color

class ThemeSerializer(serializers.Serializer):
    """Configuración visual de una tienda (solo colores, nada privado)."""

    palette = serializers.CharField(required=False, allow_null=True)
    primary = serializers.CharField()
    secondary = serializers.CharField()
    background = serializers.CharField()
    text = serializers.CharField()


class PaletteSerializer(serializers.Serializer):
    """Una paleta predefinida del catálogo."""

    key = serializers.CharField()
    label = serializers.CharField()
    primary = serializers.CharField()
    secondary = serializers.CharField()
    background = serializers.CharField()
    text = serializers.CharField()

class TenantSerializer(serializers.ModelSerializer):
    # Escritura: permite elegir una paleta predefinida o colores sueltos.
    # Lectura: se expone siempre en `theme`, con la paleta detectada.
    theme_palette = serializers.ChoiceField(
        choices=palette_choices(),
        required=False,
        write_only=True,
    )
    theme = serializers.SerializerMethodField()
    # Canales de compra activados (lista de claves, ver channels.py).
    purchase_channels = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
    )
    # Estado del plan (calculado en vivo). None si la tienda no tiene suscripción.
    subscription = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id",
            "name",
            "description",
            "logo",
            "whatsapp",
            "slug",
            "instagram_url",
            "facebook_url",
            "tiktok_url",
            "linkedin_url",
            "purchase_channels",
            "theme_primary",
            "theme_secondary",
            "theme_background",
            "theme_text",
            "theme_palette",
            "theme",
            "subscription",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "theme_primary": {"write_only": True, "required": False},
            "theme_secondary": {"write_only": True, "required": False},
            "theme_background": {"write_only": True, "required": False},
            "theme_text": {"write_only": True, "required": False},
        }

    def get_theme(self, instance):
        return theme_payload(instance)

    get_theme = extend_schema_field(ThemeSerializer)(get_theme)

    def get_subscription(self, instance):
        # getattr captura el RelatedObjectDoesNotExist de la OneToOne inversa.
        return subscription_payload(getattr(instance, "subscription", None))

    def validate_theme_primary(self, value):
        return validate_hex_color(value)

    def validate_theme_secondary(self, value):
        return validate_hex_color(value)

    def validate_theme_background(self, value):
        return validate_hex_color(value)

    def validate_theme_text(self, value):
        return validate_hex_color(value)

    def validate_purchase_channels(self, value):
        # Ignoramos los valores vacíos: el panel manda un "" para "sin canales"
        # cuando el logo viaja en un formulario multipart (no hay listas vacías).
        items = [v for v in value if isinstance(v, str) and v.strip()]
        desconocidos = [v for v in items if v not in CHANNEL_KEYS]
        if desconocidos:
            raise serializers.ValidationError(
                "Canal de compra inválido: " + ", ".join(desconocidos) + "."
            )
        return normalize_channels(items)

    def validate(self, attrs):
        # Si viene una paleta predefinida, sus colores mandan sobre los sueltos.
        palette = attrs.pop("theme_palette", None)
        if palette:
            spec = PALETTES[palette]
            attrs["theme_primary"] = spec["primary"]
            attrs["theme_secondary"] = spec["secondary"]
            attrs["theme_background"] = spec["background"]
            attrs["theme_text"] = spec["text"]

        # No permitimos activar un canal si su destino no puede generar un enlace.
        # En un PATCH parcial combinamos lo que llega con lo ya guardado.
        explicit = "purchase_channels" in attrs
        if explicit:
            canales = attrs["purchase_channels"]
        elif self.instance is not None:
            canales = normalize_channels(self.instance.purchase_channels or [])
        else:
            canales = []
        for key in canales:
            spec = PURCHASE_CHANNELS[key]
            field = spec["field"]
            # Si no estamos reescribiendo la lista, solo revisamos los canales
            # cuyo dato viene en este cambio (evita bloquear ediciones ajenas).
            if not explicit and field not in attrs:
                continue
            if field in attrs:
                value = attrs[field]
            elif self.instance is not None:
                value = getattr(self.instance, field, None)
            else:
                value = None
            if not is_valid_destination(key, value):
                raise serializers.ValidationError(
                    {
                        "purchase_channels": (
                            f"Para activar {spec['label']} primero configurá "
                            f"{spec['hint']}."
                        )
                    }
                )
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data["logo"] = optimized(instance.logo.url)
        return data

class MembershipSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    class Meta:
        model = Membership
        fields = ["id", "tenant", "user"]
        read_only_fields = ["id", "tenant"]
