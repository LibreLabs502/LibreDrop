from rest_framework import viewsets
from .models import Customer
from .serializers import CustomerSerializer
from rest_framework.permissions import IsAuthenticated
from tenants.permissions import TenantSubscriptionAccess

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, TenantSubscriptionAccess]

    def get_queryset(self): # type: ignore
        queryset = Customer.objects.select_related("tenant").filter(
            tenant_id=self.kwargs["tenant_id"]
        )
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(tenant__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant_id=self.kwargs["tenant_id"])
