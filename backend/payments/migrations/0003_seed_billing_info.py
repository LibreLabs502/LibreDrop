from django.db import migrations

# Datos iniciales de la cuenta de LibreDrop. A partir de acá la fuente de verdad
# es la base de datos: se editan desde el panel (solo superusuario), sin tocar
# código. Esta migración solo siembra los valores que ya estaban en uso.
INITIAL = {
    "bank": "Banrural",
    "account_type": "Monetaria",
    "account_number": "3397043618",
    "holder": "Angel Sebastián Rodas Rodriguez",
}


def seed(apps, schema_editor):
    BillingInfo = apps.get_model("payments", "BillingInfo")
    BillingInfo.objects.update_or_create(pk=1, defaults=INITIAL)


def unseed(apps, schema_editor):
    BillingInfo = apps.get_model("payments", "BillingInfo")
    BillingInfo.objects.filter(pk=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0002_billinginfo"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
