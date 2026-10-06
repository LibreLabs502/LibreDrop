from django.urls import path
from .views import CategoryViewSet, ProductViewSet


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
