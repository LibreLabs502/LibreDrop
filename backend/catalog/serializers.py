from rest_framework import serializers
from .models import Category, Product

class CategorySerializers(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "price", "image", "category", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
