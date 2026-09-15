from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet

router = DefaultRouter()

router.register("products", ProductViewSet, basename="product")
router.register("category", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls))
]
