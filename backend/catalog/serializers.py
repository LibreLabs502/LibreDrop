from rest_framework import serializers

from backend.images import optimized
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "description",
            "brand",
            "price",
            "sales_price",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        sales_price = attrs.get("sales_price", getattr(self.instance, "sales_price", None))

        if sales_price is not None:
            if price is None:
                raise serializers.ValidationError({
                    "sales_price": "Para poner una oferta, el producto debe tener un precio normal."
                })
            if sales_price <= 0:
                raise serializers.ValidationError({
                    "sales_price": "El precio de oferta debe ser mayor que cero."
                })
            if sales_price >= price:
                raise serializers.ValidationError({
                    "sales_price": "El precio de oferta debe ser menor que el precio normal."
                })
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data["image"] = optimized(instance.image.url)
        return data

    def validate_category(self, category):
        tenant_id = self.context["view"].kwargs["tenant_id"]

        if category.tenant_id != int(tenant_id):
            raise serializers.ValidationError("La categoria no pertenece en esta tienda")
        return category
