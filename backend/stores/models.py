from cloudinary.models import CloudinaryField
from django.db import models


class StoreProfile(models.Model):
    """Configuración y datos públicos de la tienda (esquema de su Tenant)."""

    tenant = models.OneToOneField(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='Tenant',
        help_text='Tienda (Tenant) a la que pertenece este perfil.',
    )
    trade_name = models.CharField(
        max_length=100,
        verbose_name='Nombre comercial',
        help_text='Nombre que se muestra públicamente en la tienda.',
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción corta de la tienda para la landing.',
    )
    logo = CloudinaryField(
        'Logo de la tienda',
        null=True,
        blank=True,
        help_text='Logo de la tienda almacenado en Cloudinary.',
    )
    whatsapp_number = models.CharField(
        max_length=20,
        verbose_name='WhatsApp',
        help_text='Número en formato E.164, p. ej. +50212345678. Destino de los pedidos.',
    )
    currency = models.CharField(
        max_length=3,
        default='GTQ',
        verbose_name='Moneda',
        help_text='Código ISO 4217 de la moneda, p. ej. GTQ, USD, MXN.',
    )
    primary_color = models.CharField(
        max_length=7,
        blank=True,
        verbose_name='Color principal',
        help_text='Color de marca en formato HEX, p. ej. #FF5722.',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activa',
        help_text='Si está desmarcada, la tienda no es visible públicamente.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
    )

    def __str__(self):
        return self.trade_name

    class Meta:
        verbose_name = 'Perfil de tienda'
        verbose_name_plural = 'Perfiles de tienda'