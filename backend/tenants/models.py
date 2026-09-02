from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Tenant(TenantMixin):
    name = models.CharField(max_length=200)
    auto_create_schema = True


class Domain(DomainMixin):
    pass
