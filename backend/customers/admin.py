from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone_number", "email", "tenant")
    list_filter = ("tenant",)
    search_fields = ("full_name", "phone_number", "email", "address", "tenant__name")
