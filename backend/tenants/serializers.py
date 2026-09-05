from rest_framework import serializers
from .models import Tenant, Domain, Membership

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['domain', 'is_primary']

class TenantSerializer(serializers.ModelSerializer):
    domain = DomainSerializer(many=True, read_only=True)
    class Meta:
        model = Tenant
        fields = ["id", "name", "description", "phone", "email", "logo", "domains"]
        read_only_fields = ["id", "domains"]

class TenantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["name", "description", "phone", "email", "logo"]

class MemberShipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ["id", "user", "tenant", "role"]
        read_only_fields = ["id", "tenant"]

    def create(self, validated_data):
        tenant = self.context["request"].tenat
        return Membership.objects.create(tenant=tenant, **validated_data, role=Membership.Role.OWNER)
