from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "full_name", "phone_number", "address", "email"]
        read_only_fields = ["id"]
