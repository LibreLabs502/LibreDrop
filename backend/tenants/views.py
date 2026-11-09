from rest_framework import generics, viewsets
from .serializers import MembershipSerializer, PaletteSerializer, TenantSerializer
from .models import Tenant, Membership
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .theme import palette_catalog
from .permissions import TenantSubscriptionAccess, tenant_subscription_allows_access

class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return (
            Tenant.objects.filter(memberships__user=self.request.user)
            .select_related("subscription")
            .distinct()
        )

    def perform_update(self, serializer):
        tenant = serializer.instance
        if not self.request.user.is_superuser and not tenant_subscription_allows_access(tenant):
            raise PermissionDenied("La suscripción está suspendida. Pagá para recuperar el acceso.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser and not tenant_subscription_allows_access(instance):
            raise PermissionDenied("La suscripción está suspendida. Pagá para recuperar el acceso.")
        instance.delete()


class PaletteListView(generics.ListAPIView):
    """Catálogo de paletas para el panel. Requiere sesión de administrador."""

    serializer_class = PaletteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):  # type: ignore
        return palette_catalog()

class TenantMemberView(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated, TenantSubscriptionAccess]

    def get_queryset(self): # type: ignore
        return Membership.objects.select_related("tenant", "user").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            tenant_id = self.kwargs["tenant_id"]
        )
