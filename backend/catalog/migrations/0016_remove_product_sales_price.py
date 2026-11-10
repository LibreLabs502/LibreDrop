from decimal import Decimal, ROUND_HALF_UP

from django.db import migrations


def migrate_sales_price_to_percent(apps, schema_editor):
    """Preserve old discounts as percentages before dropping the price column."""
    Product = apps.get_model("catalog", "Product")

    for product in Product.objects.all().iterator():
        percent = product.discount_percent
        sale_price = product.sales_price

        if sale_price is not None:
            if (
                product.price is not None
                and product.price > 0
                and Decimal("0") < sale_price < product.price
            ):
                percent = int(
                    ((product.price - sale_price) * Decimal("100") / product.price)
                    .quantize(Decimal("1"), rounding=ROUND_HALF_UP)
                )
                percent = min(99, max(1, percent))
            elif product.price is None or product.price <= 0:
                # No había base para recuperar el porcentaje. Mantiene la
                # oferta visible con el mínimo válido, como en la migración 0010.
                if percent is None or not 1 <= percent <= 99:
                    percent = 1
            elif percent is not None and not 1 <= percent <= 99:
                percent = None
        elif percent is not None and not 1 <= percent <= 99:
            percent = None

        updates = []
        if product.discount_percent != percent:
            product.discount_percent = percent
            updates.append("discount_percent")
        if percent is None and product.offer_ends_at is not None:
            product.offer_ends_at = None
            updates.append("offer_ends_at")
        if updates:
            product.save(update_fields=updates)


def restore_sales_price(apps, schema_editor):
    """Recreate calculated prices if this migration is rolled back."""
    Product = apps.get_model("catalog", "Product")

    for product in Product.objects.exclude(discount_percent__isnull=True).iterator():
        if product.price is None or product.price <= 0:
            continue
        sale_price = (
            product.price
            * (Decimal("100") - Decimal(product.discount_percent))
            / Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        product.sales_price = sale_price
        product.save(update_fields=["sales_price"])


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0015_product_featured_order_product_offer_ends_at_and_more"),
    ]

    operations = [
        migrations.RunPython(migrate_sales_price_to_percent, restore_sales_price),
        migrations.RemoveField(
            model_name="product",
            name="sales_price",
        ),
    ]
