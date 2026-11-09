from rest_framework import serializers

from backend.images import optimized
from .models import Category, Product, SeasonalCategory


class NullableDecimalField(serializers.DecimalField):
    """Decimal que acepta ``""`` como ``None``.

    Los formularios multipart envían una cadena vacía al borrar un precio.
    """

    def validate_empty_values(self, data):
        if data == "":
            return (True, None)
        return super().validate_empty_values(data)


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


class SeasonalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SeasonalCategory
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
    price = NullableDecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    sales_price = NullableDecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    discount_percent = NullableIntegerField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "seasonal_category",
            "name",
            "description",
            "brand",
            "price",
            "sales_price",
            "discount_percent",
            "image",
            "image2",
            "image3",
            "image4",
            "image5",
            "is_active",
            "featured",
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
        discount_percent = attrs.get(
            "discount_percent", getattr(self.instance, "discount_percent", None)
        )

        if sales_price is not None:
            if sales_price <= 0:
                raise serializers.ValidationError({
                    "sales_price": "El precio de oferta debe ser mayor que cero."
                })
            # Sin precio normal se permite la oferta; el porcentaje se toma del
            # campo manual o se muestra solo “Oferta”.
            if price is not None and sales_price >= price:
                raise serializers.ValidationError({
                    "sales_price": "El precio de oferta debe ser menor que el precio normal."
                })

        if discount_percent is not None:
            if (
                not isinstance(discount_percent, int)
                or isinstance(discount_percent, bool)
                or discount_percent < 1
                or discount_percent > 99
            ):
                raise serializers.ValidationError({
                    "discount_percent": "El porcentaje de descuento debe estar entre 1 y 99."
                })
            if sales_price is None:
                raise serializers.ValidationError({
                    "discount_percent": "Para usar un porcentaje de descuento, primero poné un precio de oferta."
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

    def validate_seasonal_category(self, category):
        tenant_id = self.context["view"].kwargs["tenant_id"]

        if category.tenant_id != int(tenant_id):
            raise serializers.ValidationError(
                "La categoria de temporada no pertenece en esta tienda"
            )
        return category
