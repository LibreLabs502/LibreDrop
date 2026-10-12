from rest_framework.routers import SimpleRouter
from .views import PaymentViewSet

router = SimpleRouter()
router.register("payments", PaymentViewSet, basename="payment")

urlpatterns = router.urls
