from django.db import models


class Payment(models.Model):
    """Método y seguimiento del pago de un pedido."""

    class Method(models.TextChoices):
        CASH_ON_DELIVERY = 'cash_on_delivery', 'Contra entrega'
        TRANSFER = 'transfer', 'Transferencia'
        OTHER = 'other', 'Otro'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        CONFIRMED = 'confirmed', 'Confirmado'
        REFUNDED = 'refunded', 'Reembolsado'

    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name='Pedido',
        help_text='Pedido al que corresponde el pago.',
    )
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.OTHER,
        verbose_name='Método',
        help_text='Forma en la que se pagará o se pagó el pedido.',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado',
        help_text='Seguimiento simple del pago.',
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Monto',
        help_text='Monto pagado o por pagar.',
    )
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia',
        help_text='Referencia externa, p. ej. número de boleta o transferencia.',
    )
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de pago',
        help_text='Cuándo se confirmó el pago.',
    )

    def __str__(self):
        return f'Pago de {self.order}'

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'