from django.db import models

from django_tenants.models import DomainMixin, TenantMixin


class Tenant(TenantMixin, models.Model):
    """Registro de una tienda en el esquema público (shared).

    Cada Tenant aísla sus propios datos creando un esquema de PostgreSQL
    propio mediante django-tenants (multi-tenant a nivel de base de datos).
    """

    schema_name = models.CharField(
        max_length=63,
        unique=True,
        db_index=True,
        verbose_name='Nombre del esquema',
        help_text='Subdominio que identifica a la tienda, p. ej. "mitienda" para "mitienda.libredrop.app".',
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre de la tienda',
        help_text='Nombre comercial con el que se identifica el Tenant.',
    )
    created_on = models.DateField(auto_now_add=True, verbose_name='Fecha de creación')

    auto_create_schema = True

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'


class Domain(DomainMixin):
    """Dominio o subdominio asociado a un Tenant."""

    pass