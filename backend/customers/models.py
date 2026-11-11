from django.db import models
class Customer(models.Model):
    # Nullable únicamente para conservar registros creados antes de asociarlos
    # a una tienda. Los nuevos clientes siempre se guardan con tenant desde la API.
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.CASCADE,
        related_name="customers",
        null=True,
        blank=True,
    )
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    email = models.EmailField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.full_name} ({self.phone_number})"

    class Meta:
        ordering = ["id"]
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
