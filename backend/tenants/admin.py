from django.contrib import admin

from .models import Domain, Membership, Tenant

admin.site.register(Tenant)

admin.site.register(Domain)

admin.site.register(Membership)