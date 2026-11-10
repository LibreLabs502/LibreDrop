import json

from rest_framework import serializers

from backend.images import optimized
from .models import PHOTO_FIELDS, Category, Product, SeasonalCategory


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


class NullableDateTimeField(serializers.DateTimeField):
    """Fecha/hora que acepta ``""`` como ``None`` (formularios multipart)."""

    def validate_empty_values(self, data):
        if data == "":
            return (True, None)
        return super().validate_empty_values(data)


class JSONListField(serializers.ListField):
    """Lista que también acepta su representación JSON en un formulario.

    En ``multipart/form-data`` los arreglos viajan como texto, así que el panel
    envía el orden de las fotos con ``JSON.stringify``.
    """

    default_error_messages = {"invalid": "El orden de las fotos no es válido."}

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except (TypeError, ValueError):
                self.fail("invalid")
        if not isinstance(data, list):
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
    discounted_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, allow_null=True
    )
    discount_percent = NullableIntegerField(
        required=False, allow_null=True, min_value=1, max_value=99
    )
    offer_ends_at = NullableDateTimeField(required=False, allow_null=True)
    photo_order = JSONListField(child=serializers.CharField(), required=False)

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
            "discounted_price",
            "discount_percent",
            "offer_ends_at",
            "image",
            "image2",
            "image3",
            "image4",
            "image5",
            "photo_order",
            "is_active",
            "featured",
            "featured_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        if "sales_price" in self.initial_data:
            raise serializers.ValidationError({
                "sales_price": (
                    "El precio de oferta ya no se ingresa; usá discount_percent."
                )
            })

        discount_percent = attrs.get(
            "discount_percent", getattr(self.instance, "discount_percent", None)
        )
        offer_ends_at = attrs.get(
            "offer_ends_at", getattr(self.instance, "offer_ends_at", None)
        )

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
        if offer_ends_at is not None and discount_percent is None:
            raise serializers.ValidationError({
                "offer_ends_at": "Para programar el fin de la oferta, primero ingresá un porcentaje de descuento."
            })

        photo_order = attrs.get("photo_order")
        if photo_order is not None:
            invalid = [key for key in photo_order if key not in PHOTO_FIELDS]
            if invalid or len(set(photo_order)) != len(photo_order):
                raise serializers.ValidationError({
                    "photo_order": "El orden de las fotos no es válido."
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
