from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Category, Product, SeasonalCategory
from .serializers import CategorySerializer, ProductSerializer, SeasonalCategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Category.objects.select_related("tenant").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant_id = self.kwargs["tenant_id"])


class SeasonalCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = SeasonalCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return SeasonalCategory.objects.select_related("tenant").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant_id = self.kwargs["tenant_id"])


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Product.objects.select_related("tenant", "category", "seasonal_category").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant_id = self.kwargs["tenant_id"])

    def reorder_featured(self, request, tenant_id=None):
        """Guarda el orden manual de los productos destacados.

        El panel envía ``{"ids": [3, 1, 2]}`` con los productos en el orden en
        que deben mostrarse. Todos quedan marcados como destacados y reciben una
        posición consecutiva.
        """
        ids = request.data.get("ids")
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "Enviá la lista de productos destacados."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        products = {
            product.id: product for product in self.get_queryset().filter(id__in=ids)
        }
        normalized = []
        for raw in ids:
            try:
                product_id = int(raw)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "La lista de productos no es válida."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if product_id not in products:
                return Response(
                    {"detail": "Hay productos que no pertenecen a esta tienda."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            normalized.append(product_id)

        if len(set(normalized)) != len(normalized):
            return Response(
                {"detail": "La lista de productos tiene repetidos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for index, product_id in enumerate(normalized):
            product = products[product_id]
            product.featured = True
            product.featured_order = index
            product.save(update_fields=["featured", "featured_order"])

        return Response({"ok": True, "ids": normalized})
