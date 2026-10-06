from rest_framework import viewsets
from .serializers import CategorySerializer, ProductSerializer
from .models import Category, Product
from rest_framework.permissions import IsAuthenticated

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Category.objects.select_related("tenant").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant_id = self.kwargs["tenant_id"])

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Product.objects.select_related("tenant", "category").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant_id = self.kwargs["tenant_id"])
