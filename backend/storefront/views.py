from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny

from tenants.models import Tenant
from tenants.services import GRACE_PERIOD_DAYS
from .serializers import PublicTenantSerializer


class PublicStoreView(generics.RetrieveAPIView):
    serializer_class = PublicTenantSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self): # type: ignore
        # La tienda sigue publicada durante los 10 días de gracia. Después,
        # deja de estar disponible hasta que se renueve la suscripción.
        cutoff = timezone.now() - timedelta(days=GRACE_PERIOD_DAYS)
        return Tenant.objects.filter(
            Q(subscription__isnull=True)
            | Q(subscription__current_period_end__gt=cutoff)
        ).prefetch_related(
            "categories",
            "seasonalcategories",
            "products__category",
            "products__seasonal_category",
        )
