from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tenants.services import activate_subscription

from .models import BillingInfo, Payment
from .serializers import BillingInfoSerializer, PaymentSerializer


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


class BillingInfoView(APIView):
    """Datos de la cuenta bancaria de LibreDrop (fila única).

    - GET: cualquier usuario autenticado (los dueños los necesitan para pagar).
    - PUT/PATCH: solo el superusuario de LibreDrop.
    """

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsSuperUser()]

    def get(self, request):
        serializer = BillingInfoSerializer(BillingInfo.load())
        return Response(serializer.data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial):
        serializer = BillingInfoSerializer(
            BillingInfo.load(), data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
