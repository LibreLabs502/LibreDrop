from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, TenantMemberView, PaletteListView
from django.urls import path, include

router = DefaultRouter()

router.register("tenant", TenantViewSet, basename="tenant")

urlpatterns = [
    path("", include(router.urls)),
    path("palettes/", PaletteListView.as_view(), name="palette-list"),
    path("tenants/<int:tenant_id>/members/", TenantMemberView.as_view({"get": "list", "post": "create"})),
    path("tenants/<int:tenant_id>/members/<int:pk>/", TenantMemberView.as_view({"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}))
]
