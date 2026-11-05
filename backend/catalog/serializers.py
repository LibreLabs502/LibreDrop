from rest_framework import serializers

from backend.images import optimized
from .models import Category, Product


class NullableIntegerField(serializers.IntegerField):
    """Entero que acepta ``""`` como ``None``.

    Los formularios multipart no pueden enviar ``null``; al editar un producto
    con fotos, un porcentaje de descuento vacío viaja como cadena vacía y debe
    borrar el valor anterior.
    """

    def validate_empty_values(self, data):
        if data == "":
            return (True, None)
        return super().validate_empty_values(data)

    def to_internal_value(self, data):
        if isinstance(data, bool):
            self.fail("invalid")
        return super().to_internal_value(data)


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
    discount_percent = NullableIntegerField(required=False, allow_null=True)

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
        discount_percent = attrs.get(
            "discount_percent", getattr(self.instance, "discount_percent", None)
        )
        if discount_percent is not None:
            if (
                not isinstance(discount_percent, int)
                or discount_percent < 1
                or discount_percent > 99
            ):
                raise serializers.ValidationError({
                    "discount_percent": "El porcentaje de descuento debe estar entre 1 y 99."
                })
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in ("image", "image2", "image3", "image4", "image5"):
            image = getattr(instance, field, None)
            if image:
                data[field] = optimized(image.url)
        return data

    def validate_category(self, category):
        tenant_id = self.context["view"].kwargs["tenant_id"]

        if category.tenant_id != int(tenant_id):
            raise serializers.ValidationError("La categoria no pertenece en esta tienda")
        return category
