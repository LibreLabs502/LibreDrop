from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import OrderViewSet, PublicOrderCreateView

router = SimpleRouter()
router.register(r"tenants/(?P<tenant_id>\d+)", OrderViewSet, basename="tenant-orders")

urlpatterns = [
    path("public/<slug:slug>/", PublicOrderCreateView.as_view(), name="public-order-create"),
    path("", include(router.urls)),
]
