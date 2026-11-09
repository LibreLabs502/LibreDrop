from decimal import Decimal, ROUND_HALF_UP

from django.db import migrations, models


def restore_sales_price(apps, schema_editor):
    """Reconstruye el precio de oferta a partir del descuento guardado.

    La migración 0010 convirtió las ofertas existentes a ``discount_percent`` y
    eliminó ``sales_price``. Como ahora las ofertas vuelven a basarse en el
    precio de oferta, recuperamos ese monto cuando todavía existe un precio
    normal. Los productos sin precio normal no tienen una base para calcularlo:
    conservan el porcentaje y la tienda puede volver a cargar el precio de
    oferta desde el panel.
    """
    Product = apps.get_model("catalog", "Product")

    for product in Product.objects.exclude(discount_percent__isnull=True).iterator():
        if product.price is None or product.price <= 0:
            continue
        sales_price = (
            product.price
            * (Decimal("100") - Decimal(product.discount_percent))
            / Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if sales_price <= 0 or sales_price >= product.price:
            continue
        product.sales_price = sales_price
        product.save(update_fields=["sales_price"])


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0013_product_seasonal_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="sales_price",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.RunPython(restore_sales_price, migrations.RunPython.noop),
    ]
