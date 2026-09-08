from rest_framework.permissions import BasePermission

from .models import Membership

class IsTenantMember(BasePermission):
    def has_permission(self, request, view): # type: ignore  # usaremos un ignore debido al warning de pyright
        tenant = getattr(request, "tenant", None)

        if not tenant:
            return False
        return Membership.objects.filter(
            user = request.user,
            tenant = request.tenant
        ).exists()

class IsTenantOwner(BasePermission):
    def has_permission(self, request, view): # type: ignore
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return False
        return Membership.objects.filter(
            user = request.user,
            tenant = request.tenant,
            role = Membership.Role.OWNER
        ).exists()
