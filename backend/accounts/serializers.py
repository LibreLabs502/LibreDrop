from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)

        return User.objects.create_user(**validated_data) # type: ignore

class LoginSerializer(TokenObtainPairSerializer):
    pass
