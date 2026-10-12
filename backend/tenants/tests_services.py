from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from tenants import services
from tenants.models import Subscription, Tenant


def make_subscription(**overrides):
    """Crea una suscripción activa que vence en 30 días por defecto."""
    tenant = Tenant.objects.create(name="Tienda Sub")
    defaults = {
        "tenant": tenant,
        "status": Subscription.Status.ACTIVE,
        "current_period_end": timezone.now() + timedelta(days=30),
    }
    defaults.update(overrides)
    return Subscription.objects.create(**defaults)


class GetSubscriptionStatusTests(TestCase):
    def test_activa_mientras_no_venza(self):
        sub = make_subscription(current_period_end=timezone.now() + timedelta(days=5))
        self.assertEqual(services.get_subscription_status(sub), Subscription.Status.ACTIVE)

    def test_past_due_dentro_de_la_gracia(self):
        sub = make_subscription(current_period_end=timezone.now() - timedelta(days=3))
        self.assertEqual(services.get_subscription_status(sub), Subscription.Status.PAST_DUE)

    def test_suspendida_despues_de_la_gracia(self):
        sub = make_subscription(
            current_period_end=timezone.now() - timedelta(days=services.GRACE_PERIOD_DAYS + 1)
        )
        self.assertEqual(services.get_subscription_status(sub), Subscription.Status.SUSPENDED)

    def test_suspendida_al_cumplirse_la_gracia(self):
        # al completarse exactamente los días de gracia -> suspendida
        sub = make_subscription(
            current_period_end=timezone.now() - timedelta(days=services.GRACE_PERIOD_DAYS)
        )
        self.assertEqual(services.get_subscription_status(sub), Subscription.Status.SUSPENDED)


class GraceDaysRemainingTests(TestCase):
    def test_activa_devuelve_la_gracia_completa(self):
        sub = make_subscription(current_period_end=timezone.now() + timedelta(days=10))
        self.assertEqual(services.get_grace_days_remaining(sub), services.GRACE_PERIOD_DAYS)

    def test_dentro_de_la_gracia_devuelve_restante(self):
        sub = make_subscription(current_period_end=timezone.now() - timedelta(days=3))
        self.assertEqual(services.get_grace_days_remaining(sub), services.GRACE_PERIOD_DAYS - 3)

    def test_fuera_de_la_gracia_devuelve_cero(self):
        sub = make_subscription(
            current_period_end=timezone.now() - timedelta(days=services.GRACE_PERIOD_DAYS + 1)
        )
        self.assertEqual(services.get_grace_days_remaining(sub), 0)


class SynchronizeSubscriptionStatusTests(TestCase):
    def test_expira_y_marca_suspendida_con_fecha(self):
        sub = make_subscription(
            current_period_end=timezone.now()
            - timedelta(days=services.GRACE_PERIOD_DAYS + 2),
            status=Subscription.Status.ACTIVE,
        )
        synced = services.synchronize_subscription_status(sub)
        self.assertEqual(synced.status, Subscription.Status.SUSPENDED)
        self.assertIsNotNone(synced.suspended_at)

        # quedó persistido
        sub.refresh_from_db()
        self.assertEqual(sub.status, Subscription.Status.SUSPENDED)
        self.assertIsNotNone(sub.suspended_at)

    def test_pago_tardio_queda_past_due_sin_suspender(self):
        sub = make_subscription(
            current_period_end=timezone.now() - timedelta(days=2),
            status=Subscription.Status.ACTIVE,
        )
        synced = services.synchronize_subscription_status(sub)
        self.assertEqual(synced.status, Subscription.Status.PAST_DUE)
        self.assertIsNone(synced.suspended_at)

    def test_reactiva_y_limpia_suspended_at(self):
        past = timezone.now() - timedelta(days=services.GRACE_PERIOD_DAYS + 5)
        sub = make_subscription(
            current_period_end=past,
            status=Subscription.Status.SUSPENDED,
            suspended_at=past,
        )
        # simula la renovación: el período vuelve al futuro
        sub.current_period_end = timezone.now() + timedelta(days=30)
        sub.save(update_fields=["current_period_end"])

        synced = services.synchronize_subscription_status(sub)
        synced.refresh_from_db()
        self.assertEqual(synced.status, Subscription.Status.ACTIVE)
        self.assertIsNone(synced.suspended_at)

    def test_sin_cambios_devuelve_igual(self):
        sub = make_subscription()
        synced = services.synchronize_subscription_status(sub)
        self.assertEqual(synced.status, Subscription.Status.ACTIVE)
        self.assertIsNone(synced.suspended_at)


class RenewSubscriptionTests(TestCase):
    def test_renueva_desde_el_vencimiento_si_sigue_en_gracia(self):
        original = timezone.now() + timedelta(days=10)
        sub = make_subscription(current_period_end=original)

        renewed = services.renew_subscription(sub, months=1)
        renewed.refresh_from_db()

        self.assertEqual(
            renewed.current_period_end,
            original + timedelta(days=services.BILLING_PERIOD_DAYS),
        )
        self.assertEqual(renewed.status, Subscription.Status.ACTIVE)
        self.assertIsNone(renewed.suspended_at)

    def test_renueva_acumulando_varios_meses(self):
        original = timezone.now() + timedelta(days=2)
        sub = make_subscription(current_period_end=original)

        renewed = services.renew_subscription(sub, months=3)
        renewed.refresh_from_db()

        self.assertEqual(
            renewed.current_period_end,
            original + timedelta(days=services.BILLING_PERIOD_DAYS * 3),
        )

    def test_renueva_desde_ahora_si_ya_paso_la_gracia(self):
        sub = make_subscription(
            current_period_end=timezone.now()
            - timedelta(days=services.GRACE_PERIOD_DAYS + 3),
            status=Subscription.Status.SUSPENDED,
            suspended_at=timezone.now(),
        )
        before = timezone.now()

        renewed = services.renew_subscription(sub, months=1)
        renewed.refresh_from_db()

        expected = before + timedelta(days=services.BILLING_PERIOD_DAYS)
        self.assertGreaterEqual(renewed.current_period_end, expected - timedelta(seconds=2))
        self.assertLessEqual(renewed.current_period_end, expected + timedelta(seconds=2))
        self.assertEqual(renewed.status, Subscription.Status.ACTIVE)
        self.assertIsNone(renewed.suspended_at)

    def test_rechaza_meses_menores_a_uno(self):
        sub = make_subscription()
        with self.assertRaises(ValueError):
            services.renew_subscription(sub, months=0)

    def test_rechaza_meses_no_enteros(self):
        sub = make_subscription()
        with self.assertRaises(ValueError):
            services.renew_subscription(sub, months=1.5)