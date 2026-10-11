from rest_framework import serializers

from accounts.serializers import UserSerializer
from backend.images import optimized
from .models import Tenant, Membership

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            "id",
            "name",
            "description",
            "logo",
            "whatsapp",
            "slug",
            "instragram_url",
            "facebook_url",
            "tiktok_url",
            "linkedin_url",
        ]
        read_only_fields = ["id"]

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
