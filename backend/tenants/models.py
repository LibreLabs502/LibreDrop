from django.db import models
from cloudinary.models import CloudinaryField

class Tenant(models.Model):
    name = models.CharField(max_length=200)
    desciption = models.TextField(blank=True)
    logo = CloudinaryField("logo")

    class Meta:
        ordering = ["id"]
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"

    def __str__(self) -> str:
        return f"Tenant {self.name}"
