from django.contrib.auth import get_user_model
from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Tenant(TenantMixin):
    name = models.CharField(max_length=200)
    auto_create_schema = True

class Domain(DomainMixin):
    pass

class Membership(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="memberships")
    tenant = models.ForeignKey("tenants.Tenant", on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=200)
