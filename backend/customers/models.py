from django.db import models

# Create your models here.
class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    email = models.EmailField(blank=True, null=True)

    def __str__(self) -> str:
        return self.full_name

    class Meta:
        ordering = ["id"]
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
