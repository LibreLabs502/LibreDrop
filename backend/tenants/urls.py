from rest_framework.routers import DefaultRouter
from .views import TenantViewSet
from django.urls import path, include

router = DefaultRouter()

router.register("tenant", TenantViewSet, basename="tenant")

urlpatterns = [
    path("", include(router.urls))
]
