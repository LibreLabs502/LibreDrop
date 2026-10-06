from rest_framework import serializers

from tenants.models import Tenant
from catalog.models import Category, Product


class PublicCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
        ]


class PublicProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "description",
            "price",
            "image",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data["image"] = instance.image.url
        return data


class PublicTenantSerializer(serializers.ModelSerializer):
    categories = PublicCategorySerializer(many=True, read_only=True)
    products = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "whatsapp",
            "categories",
            "products",
        ]

    def get_products(self, tenant):
        products = tenant.products.filter(
            is_active=True
        ).select_related("category")

        return PublicProductSerializer(
            products,
            many=True,
            context=self.context,
        ).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data["logo"] = instance.logo.url
        return data
