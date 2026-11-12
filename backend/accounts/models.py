from django.db import models
from django.contrib.auth.models import AbstractUser
from tenants.models import Tenant

class User(AbstractUser):
    agreement_version = models.CharField(max_length=20, blank=True, default="")
    agreement_accepted_at = models.DateTimeField(null=True, blank=True)
