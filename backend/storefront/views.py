from rest_framework import generics
from rest_framework.permissions import AllowAny

from tenants.models import Tenant
from .serializers import PublicTenantSerializer


class PublicStoreView(generics.RetrieveAPIView):
    serializer_class = PublicTenantSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self): # type: ignore
        return Tenant.objects.prefetch_related(
            "categories",
            "products__category",
        )
