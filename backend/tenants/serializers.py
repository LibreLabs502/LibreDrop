from rest_framework import serializers

from backend.accounts.serializers import UserSerializer
from .models import Tenant, Membership

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "description", "logo"]
        read_only_fields = ["id"]

class MembershipSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    class Meta:
        model = Membership
        fields = ["id", "tenant", "user"]
        read_only_fields = ["id", "tenant"]
