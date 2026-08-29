from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'unit_price', 'quantity']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'status', 'total', 'created_at']
    list_filter = ['status']
    search_fields = ['customer__name', 'customer__phone', 'notes']
    readonly_fields = ['subtotal', 'shipping', 'total', 'created_at']
    inlines = [OrderItemInline]