from django.db import models
from cloudinary.models import CloudinaryField
from django.utils.text import slugify

from django.conf import settings

class Tenant(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    logo = CloudinaryField("logo")
    whatsapp = models.CharField(max_length=20, blank=False, null=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"

    def __str__(self) -> str:
        return f"Tenant {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 2
            while Tenant.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        return super().save(*args, **kwargs)

class Membership(models.Model):
    class Role(models.TextChoices):
        owner = "OWNER"
        staff = "STAFF"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=200, choices=Role, default=Role.owner)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["tenant", "user"], name="unique_tenant_user")
        ]
