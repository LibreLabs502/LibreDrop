from django.contrib import admin

from .models import BillingInfo


@admin.register(BillingInfo)
class BillingInfoAdmin(admin.ModelAdmin):
    list_display = ("bank", "account_type", "account_number", "holder", "updated_at")
