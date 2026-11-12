from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "quantity", "unit_price", "original_unit_price", "discount_percent")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("public_id", "tenant", "customer", "status", "channel", "created_at")
    list_filter = ("status", "channel", "created_at")
    search_fields = ("public_id", "customer__full_name", "customer__phone_number", "tenant__name")
    readonly_fields = ("public_id", "created_at", "updated_at")
    inlines = (OrderItemInline,)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "quantity", "unit_price")
    search_fields = ("product_name", "order__public_id")

# Register your models here.
