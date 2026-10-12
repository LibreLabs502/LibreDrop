from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from accounts.serializers import UserSerializer
from backend.images import optimized
from .models import Tenant, Membership
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
            "theme_primary",
            "theme_secondary",
            "theme_background",
            "theme_text",
            "theme_palette",
            "theme",
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

    def validate_theme_primary(self, value):
        return validate_hex_color(value)

    def validate_theme_secondary(self, value):
        return validate_hex_color(value)

    def validate_theme_background(self, value):
        return validate_hex_color(value)

    def validate_theme_text(self, value):
        return validate_hex_color(value)

    def validate(self, attrs):
        # Si viene una paleta predefinida, sus colores mandan sobre los sueltos.
        palette = attrs.pop("theme_palette", None)
        if palette:
            spec = PALETTES[palette]
            attrs["theme_primary"] = spec["primary"]
            attrs["theme_secondary"] = spec["secondary"]
            attrs["theme_background"] = spec["background"]
            attrs["theme_text"] = spec["text"]
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
