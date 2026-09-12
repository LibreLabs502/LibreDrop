from .views import TenantViewSet, DomainViewSet, MemberShipViewSet
from rest_framework.routers import DefaultRouter
from django.urls import include, path


router = DefaultRouter()

router.register("tenants", TenantViewSet, basename="tenant")
router.register("domains", DomainViewSet, basename="domain")
router.register("memberships", MemberShipViewSet, basename="membership")

urlpatterns = [
    path("", include(router.urls)),
]
