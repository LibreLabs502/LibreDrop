from rest_framework import serializers
from .models import Tenant, Domain, Membership

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['domain', 'is_primary']

class TenantSerializer(serializers.ModelSerializer):
    domains = DomainSerializer(many=True, read_only=True)
    class Meta:
        model = Tenant
        fields = ["id", "name", "description", "phone", "email", "logo", "domains"]
        read_only_fields = ["id", "domains"]

class TenantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["name", "description", "phone", "email", "logo"]

class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ["id", "user", "tenant", "role"]
        read_only_fields = ["id", "tenant"]
