
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import Subscription


GRACE_PERIOD_DAYS = 10
BILLING_PERIOD_DAYS = 30


def get_subscription_status(subscription):
    """Calcula el estado actual sin modificar la base de datos."""
    now = timezone.now()
    expires_at = subscription.current_period_end
    grace_ends_at = expires_at + timedelta(days=GRACE_PERIOD_DAYS)

    if now < expires_at:
        return Subscription.Status.ACTIVE

    if now < grace_ends_at:
        return Subscription.Status.PAST_DUE

    return Subscription.Status.SUSPENDED


def get_grace_days_remaining(subscription):
    """Días de gracia restantes, redondeando hacia arriba.
    Si la suscripción aún está activa, la gracia no ha empezado: se
    devuelve el total de días de gracia."""
    now = timezone.now()
    expires_at = subscription.current_period_end
    grace_ends_at = expires_at + timedelta(days=GRACE_PERIOD_DAYS)

    if now < expires_at:
        return GRACE_PERIOD_DAYS

    if now >= grace_ends_at:
        return 0

    remaining = grace_ends_at - now
    return remaining.days + bool(
        remaining.seconds or remaining.microseconds
    )


@transaction.atomic
def synchronize_subscription_status(subscription):
    """
    Calcula y guarda el estado actual de la suscripción.
    Si pasa a suspendida, registra cuándo ocurrió.
    """
    subscription = (
        Subscription.objects.select_for_update()
        .get(pk=subscription.pk)
    )

    new_status = get_subscription_status(subscription)
    update_fields = []

    if subscription.status != new_status:
        subscription.status = new_status
        update_fields.append("status")

    if (
        new_status == Subscription.Status.SUSPENDED
        and subscription.suspended_at is None
    ):
        subscription.suspended_at = timezone.now()
        update_fields.append("suspended_at")

    if (
        new_status != Subscription.Status.SUSPENDED
        and subscription.suspended_at is not None
    ):
        subscription.suspended_at = None
        update_fields.append("suspended_at")

    if update_fields:
        subscription.save(update_fields=update_fields)

    return subscription


@transaction.atomic
def renew_subscription(subscription, months=1):
    """
    Renueva una suscripción después de confirmar el pago.
    Mantiene la fecha de vencimiento actual si aún no terminó
    el período de gracia; de lo contrario, comienza desde ahora.
    """
    if isinstance(months, bool) or not isinstance(months, int) or months < 1:
        raise ValueError(
            "La renovación debe ser un número entero de meses (mínimo 1)."
        )

    subscription = (
        Subscription.objects.select_for_update()
        .get(pk=subscription.pk)
    )

    now = timezone.now()
    expires_at = subscription.current_period_end
    grace_ends_at = expires_at + timedelta(days=GRACE_PERIOD_DAYS)

    if now < grace_ends_at:
        base_date = expires_at
    else:
        base_date = now

    subscription.current_period_end = (
        base_date + timedelta(days=BILLING_PERIOD_DAYS * months)
    )
    subscription.status = Subscription.Status.ACTIVE
    subscription.suspended_at = None

    subscription.save(
        update_fields=[
            "current_period_end",
            "status",
            "suspended_at",
        ]
    )

    return subscription


def subscription_payload(subscription):
    """Datos de suscripción para el panel (estado calculado en vivo)."""
    if subscription is None:
        return None
    return {
        "status": get_subscription_status(subscription),
        "current_period_end": subscription.current_period_end,
        "grace_days_remaining": get_grace_days_remaining(subscription),
    }


def activate_subscription(tenant, months=1):
    """Activa/renueva el plan de una tienda. Crea la suscripción si no existe."""
    subscription, _ = Subscription.objects.get_or_create(
        tenant=tenant,
        defaults={"current_period_end": timezone.now()},
    )
    return renew_subscription(subscription, months=months)
