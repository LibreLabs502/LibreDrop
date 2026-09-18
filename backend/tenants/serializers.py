from rest_framework import serializers
from .models import Tenant, Domain, Membership

class CloudinaryUrlField(serializers.Field):
    """Campo Cloudinary: acepta un archivo al escribir y devuelve la URL completa al leer."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_null", True)
        super().__init__(*args, **kwargs)

    def to_representation(self, value):
        build_url = getattr(value, "build_url", None)
        return build_url(secure=True) if build_url else None

    def to_internal_value(self, data):
        if data is None or data == "":
            return None
        return data

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['domain', 'is_primary']

class TenantSerializer(serializers.ModelSerializer):
    domains = DomainSerializer(many=True, read_only=True)
    logo = CloudinaryUrlField()
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
