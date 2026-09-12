from rest_framework import viewsets
from .models import Tenant, Domain, Membership
from .serializers import TenantSerializer, TenantCreateSerializer, DomainSerializer, MembershipSerializer
from .permissions import IsTenantMember, IsTenantOwner

# Create your views here.
class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer

    def get_serializer_class(self): # type: ignore
        if self.action == "create":
            return TenantCreateSerializer

        return TenantSerializer

    def get_queryset(self): # type: ignore
        return Tenant.objects.filter(
            memberships__user = self.request.user
        ).distinct()

    def perform_create(self, serializer):
        tenant = serializer.save()

        Membership.objects.create(
            user = self.request.user,
            tenant = tenant,
            role = Membership.Role.OWNER
        )

class DomainViewSet(viewsets.ModelViewSet):
    serializer_class = DomainSerializer

    def get_queryset(self): # type:ignore
        return Domain.objects.select_related(
            "tenant"
        ).filter(
            tenant = self.request.tenant # type: ignore
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsTenantMember()]

        return [IsTenantOwner()]

class MemberShipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer

    def get_queryset(self): # type: ignore
        return Membership.objects.select_related(
            "user",
            "tenant"
        ).filter(
            tenant = self.request.tenant # type: ignore
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsTenantMember()]
        return [IsTenantOwner()]

    def perform_create(self, serializer):
        serializer.save(
            tenant = self.request.tenant # type: ignore
        )
