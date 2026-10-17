from rest_framework import serializers

from backend.images import optimized
from .models import BillingInfo, Payment


class PaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "description",
            "image",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]
        extra_kwargs = {
            "image": {"required": False, "allow_null": True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data["image"] = optimized(instance.image.url)
        return data


class BillingInfoSerializer(serializers.ModelSerializer):
    """Datos de la cuenta bancaria de LibreDrop (fila única)."""

    class Meta:
        model = BillingInfo
        fields = ["bank", "account_type", "account_number", "holder", "updated_at"]
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "bank": {"required": True, "allow_blank": False},
            "account_type": {"required": True, "allow_blank": False},
            "account_number": {"required": True, "allow_blank": False},
            "holder": {"required": True, "allow_blank": False},
        }
