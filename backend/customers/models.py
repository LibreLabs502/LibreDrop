from django.db import models


class Customer(models.Model):
    """Comprador que contacta a la tienda por WhatsApp."""

    name = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre del cliente.',
    )
    phone = models.CharField(
        max_length=20,
        verbose_name='Teléfono',
        help_text='Número en formato E.164, p. ej. +50212345678. Contacto de WhatsApp.',
    )
    email = models.EmailField(
        blank=True,
        verbose_name='Correo electrónico',
        help_text='Correo del cliente (opcional).',
    )
    address = models.TextField(
        blank=True,
        verbose_name='Dirección',
        help_text='Dirección de entrega (opcional).',
    )
    notes = models.TextField(
        blank=True,
        verbose_name='Notas',
        help_text='Notas internas del vendedor sobre el cliente.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['name']