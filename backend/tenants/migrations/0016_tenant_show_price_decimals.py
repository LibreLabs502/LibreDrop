from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tenants", "0015_remove_tenant_purchase_button_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="show_price_decimals",
            field=models.BooleanField(default=False),
        ),
    ]
