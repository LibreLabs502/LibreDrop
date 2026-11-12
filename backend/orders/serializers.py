from rest_framework import serializers

from customers.models import Customer
from .models import Order, OrderItem


class OrderCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "full_name", "phone_number", "address", "email"]


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "quantity", "unit_price",
            "original_unit_price", "discount_percent", "line_total",
        ]

    def get_line_total(self, item):
        if item.unit_price is None:
            return None
        return item.unit_price * item.quantity


class OrderReadSerializer(serializers.ModelSerializer):
    customer = OrderCustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "public_id", "status", "channel", "notes", "customer",
            "items", "total", "created_at", "updated_at",
        ]

    def get_total(self, order):
        items = list(order.items.all())
        if any(item.unit_price is None for item in items):
            return None
        return sum((item.unit_price * item.quantity for item in items), start=0)


class PublicOrderCreateSerializer(serializers.Serializer):
    customer = serializers.DictField()
    items = serializers.ListField(
        child=serializers.DictField(), allow_empty=False, max_length=50
    )
    channel = serializers.ChoiceField(choices=Order.Channel.choices)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=4000)

    def validate_customer(self, value):
        name = str(value.get("full_name", "")).strip()
        phone = str(value.get("phone_number", "")).strip()
        address = str(value.get("address", "")).strip()
        email = str(value.get("email") or "").strip()
        if not name:
            raise serializers.ValidationError({"full_name": "Ingresá tu nombre y apellido."})
        if not phone or len(phone) > 20:
            raise serializers.ValidationError({"phone_number": "Ingresá un número de teléfono válido."})
        if not address:
            raise serializers.ValidationError({"address": "Ingresá la dirección de entrega."})
        if email:
            try:
                email = serializers.EmailField().run_validation(email)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({"email": "Ingresá un correo válido."}) from exc
        return {"full_name": name, "phone_number": phone, "address": address, "email": email or None}

    def validate_items(self, items):
        normalized = []
        seen = set()
        for item in items:
            try:
                product_id = int(item.get("product_id"))
                quantity = int(item.get("quantity", 1))
            except (TypeError, ValueError):
                raise serializers.ValidationError("Revisá los productos y cantidades del pedido.")
            if product_id < 1 or quantity < 1 or quantity > 99:
                raise serializers.ValidationError("Cada cantidad debe estar entre 1 y 99.")
            if product_id in seen:
                raise serializers.ValidationError("El pedido contiene un producto repetido.")
            seen.add(product_id)
            normalized.append({"product_id": product_id, "quantity": quantity})
        return normalized


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
