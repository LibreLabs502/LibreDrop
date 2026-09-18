from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import Tenant, Domain, Membership
from .serializers import TenantSerializer, TenantCreateSerializer, DomainSerializer, MembershipSerializer
from .permissions import IsTenantMember, IsTenantOwner

class StoreView(APIView):
    """Información pública de la tienda resuelta por el tenant de la petición."""
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return Response(
                {"detail": "Tienda no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(TenantSerializer(tenant).data)

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
