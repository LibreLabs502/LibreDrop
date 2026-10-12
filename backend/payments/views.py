from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from tenants.services import activate_subscription

from .models import Payment
from .serializers import PaymentSerializer


class IsSuperUser(BasePermission):
    """Solo el superusuario de LibreDrop (no cualquier staff)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer

    def get_permissions(self):
        # El dueño de la tienda solo puede subir su comprobante (POST).
        # Ver y gestionar los pagos queda reservado al superusuario.
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsSuperUser()]

    def get_queryset(self):  # type: ignore
        return Payment.objects.select_related("tenant").all()

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Marca el pago como aprobado y activa/renueva el plan de la tienda."""
        payment = self.get_object()
        activate_subscription(payment.tenant, months=1)

        payment.status = Payment.Status.APPROVED
        payment.save(update_fields=["status", "updated_at"])

        return Response(self.get_serializer(payment).data)
