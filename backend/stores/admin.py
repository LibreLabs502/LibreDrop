from django.contrib import admin

from .models import StoreProfile


@admin.register(StoreProfile)
class StoreProfileAdmin(admin.ModelAdmin):
    list_display = ['trade_name', 'tenant', 'whatsapp_number', 'currency', 'is_active']
    list_filter = ['is_active', 'currency']
    search_fields = ['trade_name', 'whatsapp_number']