from django.db import migrations, models


def enable_decimals_for_existing_tenants(apps, schema_editor):
    Tenant = apps.get_model("tenants", "Tenant")
    Tenant.objects.all().update(show_price_decimals=True)


class Migration(migrations.Migration):
    dependencies = [
        ("tenants", "0016_tenant_show_price_decimals"),
    ]

    operations = [
        migrations.RunPython(
            enable_decimals_for_existing_tenants,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="tenant",
            name="show_price_decimals",
            field=models.BooleanField(default=True),
        ),
    ]
