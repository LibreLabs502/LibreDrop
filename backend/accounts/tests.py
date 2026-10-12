from django.test import TestCase
from rest_framework.test import APIClient

from payments.models import Payment
from tenants.models import Subscription, Tenant


class RegisterPaymentTests(TestCase):
    def test_register_creates_tienda_sin_plan_y_un_pago_en_espera(self):
        res = APIClient().post(
            "/auth/register/",
            {
                "username": "panaderia",
                "email": "pan@example.com",
                "first_name": "Pan",
                "last_name": "Dero",
                "password": "claveSegura123",
                "password_confirm": "claveSegura123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)

        tenant = Tenant.objects.get(name="Tienda de panaderia")

        # Sin plan de prueba: no hay suscripción hasta que el superusuario active.
        self.assertFalse(Subscription.objects.filter(tenant=tenant).exists())

        # El registro deja el pago en espera para que el superusuario lo active.
        payment = Payment.objects.get(tenant=tenant)
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(payment.description, "Registro: activación de cuenta")