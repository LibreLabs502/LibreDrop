from django.urls import path
from .views import CategoryViewSet, ProductViewSet, SeasonalCategoryViewSet


urlpatterns = [
    path(
        "tenants/<int:tenant_id>/categories/",
        CategoryViewSet.as_view({
            "get": "list",
            "post": "create",
        }),
    ),
    path(
        "tenants/<int:tenant_id>/categories/<int:pk>/",
        CategoryViewSet.as_view({
            "get": "retrieve",
            "patch": "partial_update",
            "put": "update",
            "delete": "destroy",
        }),
    ),
    path(
        "tenants/<int:tenant_id>/seasonal-categories/",
        SeasonalCategoryViewSet.as_view({
            "get": "list",
            "post": "create",
        }),
    ),
    path(
        "tenants/<int:tenant_id>/seasonal-categories/<int:pk>/",
        SeasonalCategoryViewSet.as_view({
            "get": "retrieve",
            "patch": "partial_update",
            "put": "update",
            "delete": "destroy",
        }),
    ),

    path(
        "tenants/<int:tenant_id>/products/reorder-featured/",
        ProductViewSet.as_view({
            "post": "reorder_featured",
        }),
    ),
    path(
        "tenants/<int:tenant_id>/products/",
        ProductViewSet.as_view({
            "get": "list",
            "post": "create",
        }),
    ),
    path(
        "tenants/<int:tenant_id>/products/<int:pk>/",
        ProductViewSet.as_view({
            "get": "retrieve",
            "patch": "partial_update",
            "put": "update",
            "delete": "destroy",
        }),
    ),
]
