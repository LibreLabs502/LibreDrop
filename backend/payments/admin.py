from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'method', 'status', 'amount', 'paid_at']
    list_filter = ['method', 'status']
    search_fields = ['order__id', 'transaction_id']