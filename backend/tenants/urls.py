from .views import StoreView, TenantViewSet, DomainViewSet, MemberShipViewSet
from rest_framework.routers import DefaultRouter
from django.urls import include, path


router = DefaultRouter()

router.register("tenants", TenantViewSet, basename="tenant")
router.register("domains", DomainViewSet, basename="domain")
router.register("memberships", MemberShipViewSet, basename="membership")

urlpatterns = [
    path("store/", StoreView.as_view(), name="store"),
    path("", include(router.urls)),
]
