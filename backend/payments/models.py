from cloudinary.models import CloudinaryField
from django.db import models


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        APPROVED = "approved", "Aprobado"
        REJECTED = "rejected", "Rechazado"

    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    description = models.TextField(blank=True)
    image = CloudinaryField("image")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"

    def __str__(self):
        return f"{self.tenant.name} - {self.get_status_display()}"


class BillingInfo(models.Model):
    """Datos de la cuenta bancaria de LibreDrop (fila única).

    Es la cuenta donde los dueños de tiendas depositan la suscripción. Vive en
    la base de datos —no en el código— para poder cambiarla desde el panel sin
    volver a desplegar.
    """

    bank = models.CharField("banco", max_length=100, default="")
    account_type = models.CharField("tipo de cuenta", max_length=50, default="")
    account_number = models.CharField("número de cuenta", max_length=50, default="")
    holder = models.CharField("titular", max_length=150, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "datos de pago"
        verbose_name_plural = "datos de pago"

    def __str__(self):
        return f"{self.bank} · {self.account_number}"

    @classmethod
    def load(cls):
        """Devuelve la fila única, creándola vacía si todavía no existe."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
