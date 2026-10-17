from django.urls import path
from rest_framework.routers import SimpleRouter
from .views import BillingInfoView, PaymentViewSet

router = SimpleRouter()
router.register("payments", PaymentViewSet, basename="payment")

# `payments/billing/` va antes del router para que no lo capture como un pk.
urlpatterns = [
    path("payments/billing/", BillingInfoView.as_view(), name="billing-info"),
] + router.urls
