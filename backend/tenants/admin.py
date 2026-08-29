from django.contrib import admin

from .models import Domain, Tenant

admin.site.register(Tenant)

admin.site.register(Domain)