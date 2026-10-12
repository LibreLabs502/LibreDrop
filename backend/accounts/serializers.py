from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from payments.models import Payment
from tenants.models import Membership, Tenant

User = get_user_model()

class RegisterSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "first_name", "last_name"]

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError({"error": "Las contraseñas no coinciden"})

        return attrs
    @transaction.atomic()
    def create(self, validated_data):
        validated_data.pop("password_confirm", None)

        user = User.objects.create_user(**validated_data) # type: ignore

        tenant = Tenant.objects.create(name=f"Tienda de {user.username}")

        Membership.objects.create(user=user, tenant=tenant, role=Membership.Role.owner)

        # Sin plan de prueba: el registro deja la tienda pendiente de pago.
        # Se crea un pago en espera (sin comprobante) para que el superusuario
        # lo vea en su tabla y active la cuenta; la suscripción recién nace
        # cuando se activa. El dueño avisa por WhatsApp para que la activen.
        Payment.objects.create(
            tenant=tenant,
            description="Registro: activación de cuenta",
        )

        return user

class LoginSerializer(TokenObtainPairSerializer):
    pass

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_superuser"]
        read_only_fields = fields
