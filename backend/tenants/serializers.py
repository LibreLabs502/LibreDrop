from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Tenant, Membership

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "description", "logo", "whatsapp", "slug"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data["logo"] = instance.logo.url
        return data

class MembershipSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    class Meta:
        model = Membership
        fields = ["id", "tenant", "user"]
        read_only_fields = ["id", "tenant"]
