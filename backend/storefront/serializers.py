from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from backend.images import optimized
from tenants.channels import effective_channels
from tenants.models import Tenant
from tenants.serializers import ThemeSerializer
from tenants.theme import theme_payload
from catalog.models import Category, Product


class PublicCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
        ]


class PublicProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "description",
            "brand",
            "price",
            "discount_percent",
            "image",
            "image2",
            "image3",
            "image4",
            "image5",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in ("image", "image2", "image3", "image4", "image5"):
            image = getattr(instance, field, None)
            if image:
                data[field] = optimized(image.url)
        return data


class PublicTenantSerializer(serializers.ModelSerializer):
    categories = PublicCategorySerializer(many=True, read_only=True)
    products = serializers.SerializerMethodField()
    theme = serializers.SerializerMethodField()
    # Solo los canales activados que además tienen un destino válido: nunca
    # exponemos un botón de compra que no pueda abrir un enlace.
    purchase_channels = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "purchase_button_text",
            "sale_text",
            "whatsapp",
            "instagram_url",
            "facebook_url",
            "tiktok_url",
            "linkedin_url",
            "purchase_channels",
            "categories",
            "products",
            "theme",
        ]

    def get_purchase_channels(self, tenant):
        return effective_channels(tenant)

    def get_theme(self, tenant):
        # Solo datos visuales: colores y clave de paleta. Nada privado.
        return theme_payload(tenant)

    get_theme = extend_schema_field(ThemeSerializer)(get_theme)

    def get_products(self, tenant):
        products = tenant.products.filter(
            is_active=True
        ).select_related("category")

        return PublicProductSerializer(
            products,
            many=True,
            context=self.context,
        ).data

    get_products = extend_schema_field(PublicProductSerializer(many=True))(get_products)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data["logo"] = optimized(instance.logo.url)
        return data
