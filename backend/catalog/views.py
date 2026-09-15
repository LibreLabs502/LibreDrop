from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from tenants.permissions import IsTenantMember
from .models import Category, Product
from .serializers import CategorySerializers, ProductSerializer
# Create your views here.
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializers

    def get_queryset(self): # type: ignore
        return Category.objects.all()

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated(), IsTenantMember()]

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self): # type: ignore
        return Product.objects.all()

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated(), IsTenantMember()]
