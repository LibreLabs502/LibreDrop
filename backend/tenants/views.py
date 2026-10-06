from rest_framework import viewsets
from .serializers import MembershipSerializer, TenantSerializer
from .models import Tenant, Membership
from rest_framework.permissions import IsAuthenticated

class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Tenant.objects.all()

class TenantMemberView(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Membership.objects.select_related("tenant", "user").filter(tenant_id=self.kwargs["tenant_id"], tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            tenant_id = self.kwargs["tenant_id"]
        )
