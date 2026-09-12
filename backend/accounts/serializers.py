from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.text import slugify

from rest_framework import serializers

from tenants.models import Membership, Tenant, Domain

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    tenant_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "confirm_password", "tenant_name"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        attrs.pop("confirm_password")

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        tenant_name = validated_data.pop("tenant_name")

        user = User.objects.create_user(**validated_data) # type: ignore

        base = slugify(tenant_name) or f"tenant-{user.id}"
        schema_name = base.replace("-", "_")

        tenant = Tenant.objects.create(
            schema_name = schema_name,
            name=tenant_name,
        )

        membership = Membership.objects.create(
            user = user,
            tenant = tenant,
            role = Membership.Role.OWNER
        )

        Domain.objects.create(
            domain = f"{base}.localhost",
            tenant = tenant,
            is_primary = True
        )

        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only = True, required = True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(username = username, password = password)
        if not user:
            raise serializers.ValidationError("Credenciales invalidas")

        attrs["user"] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name"]
        read_only_fields = ["email"]
