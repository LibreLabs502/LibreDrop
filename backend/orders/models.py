from django.db import models


class Order(models.Model):
    """Pedido recibido por la tienda vía WhatsApp."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        SENT_WHATSAPP = 'sent_wa', 'Enviado por WhatsApp'
        CONFIRMED = 'confirmed', 'Confirmado'
        FULFILLED = 'fulfilled', 'Entregado'
        CANCELLED = 'cancelled', 'Cancelado'

    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name='Cliente',
        help_text='Cliente que realizó el pedido.',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado',
        help_text='Etapa del ciclo de vida del pedido.',
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Subtotal',
        help_text='Suma de los productos sin envío ni descuentos.',
    )
    shipping = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Envío',
        help_text='Costo de envío aplicado al pedido.',
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Total',
        help_text='Monto total del pedido (subtotal + envío).',
    )
    shipping_address = models.TextField(
        blank=True,
        verbose_name='Dirección de envío',
        help_text='Dirección donde se entrega el pedido.',
    )
    notes = models.TextField(
        blank=True,
        verbose_name='Notas',
        help_text='Notas del cliente o del vendedor sobre el pedido.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
    )

    def __str__(self):
        return f'Pedido #{self.pk}'

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-created_at']


class OrderItem(models.Model):
    """Línea de un pedido con una fotografía del producto en ese momento."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Pedido',
        help_text='Pedido al que pertenece la línea.',
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_items',
        verbose_name='Producto',
        help_text='Producto referenciado. Puede quedar nulo si se elimina el producto.',
    )
    product_name = models.CharField(
        max_length=200,
        verbose_name='Nombre del producto',
        help_text='Snapshot del nombre al momento del pedido. No cambia aunque el producto se modifique.',
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad',
        help_text='Unidades solicitadas de este producto.',
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Snapshot del precio del producto al momento del pedido.',
    )

    @property
    def total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f'{self.product_name} x{self.quantity}'

    class Meta:
        verbose_name = 'Línea de pedido'
        verbose_name_plural = 'Líneas de pedido'