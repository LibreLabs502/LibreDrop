from django.db import migrations


def set_default_purchase_channels(apps, schema_editor):
    """Preserva el comportamiento actual de las tiendas existentes.

    Hasta ahora, el único canal de compra de la tienda pública era WhatsApp.
    Por eso, a las tiendas que ya tengan un número cargado les activamos ese
    canal; el resto queda sin canales (los eligen desde el panel).
    """
    Tenant = apps.get_model("tenants", "Tenant")
    for tenant in Tenant.objects.all():
        digits = "".join(ch for ch in str(tenant.whatsapp or "") if ch.isdigit())
        tenant.purchase_channels = ["whatsapp"] if digits else []
        tenant.save(update_fields=["purchase_channels"])


def unset_default_purchase_channels(apps, schema_editor):
    Tenant = apps.get_model("tenants", "Tenant")
    Tenant.objects.update(purchase_channels=[])


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0010_tenant_purchase_channels_alter_tenant_facebook_url_and_more"),
    ]

    operations = [
        migrations.RunPython(
            set_default_purchase_channels,
            unset_default_purchase_channels,
        ),
    ]
