from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from cloudinary.models import CloudinaryField

class Tenant(TenantMixin):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    logo = CloudinaryField("logo", blank=True, null=True)

    auto_create_schema = True

class Domain(DomainMixin):
    pass

class Membership(models.Model):
    class Role(models.TextChoices):
        OWNER = "OWNER", "Owner"
        STAFF = "STAFF", "Staff"

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="memberships")
    tenant = models.ForeignKey("tenants.Tenant", on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OWNER)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "tenant"],
                name="unique_user_tenant_membership",
            )
        ]
