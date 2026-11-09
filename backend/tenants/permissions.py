from rest_framework.permissions import BasePermission

from .models import Subscription, Tenant
from .services import get_subscription_status


def tenant_subscription_allows_access(tenant):
    """El plan da acceso mientras está activo o dentro de los 10 días de gracia."""
    try:
        subscription = tenant.subscription
    except Subscription.DoesNotExist:
        return False

    return get_subscription_status(subscription) != Subscription.Status.SUSPENDED


class TenantSubscriptionAccess(BasePermission):
    """Bloquea las API de una tienda sin plan o con el plan suspendido."""

    message = "La suscripción está suspendida. Pagá para recuperar el acceso."

    def has_permission(self, request, view):
        tenant_id = view.kwargs.get("tenant_id")
        if tenant_id is None:
            return True

        if request.user.is_superuser:
            return True

        tenant = Tenant.objects.filter(
            pk=tenant_id,
            memberships__user=request.user,
        ).select_related("subscription").first()
        return tenant is not None and tenant_subscription_allows_access(tenant)
