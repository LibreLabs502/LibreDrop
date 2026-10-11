from django.test import TestCase

from .models import Tenant


class TenantSlugTests(TestCase):
    def test_crea_slug_desde_el_nombre(self):
        t = Tenant.objects.create(name="Mi Tienda")
        self.assertEqual(t.slug, "mi-tienda")

    def test_renombrar_no_cambia_el_slug(self):
        t = Tenant.objects.create(name="Mi Tienda")
        t.name = "Otro Nombre"
        t.save()
        self.assertEqual(t.slug, "mi-tienda")
        self.assertNotEqual(t.name, t.slug)

    def test_slug_unico_al_crear(self):
        Tenant.objects.create(name="Mi Tienda")
        t2 = Tenant.objects.create(name="Mi Tienda")
        self.assertEqual(t2.slug, "mi-tienda-2")

    def test_nombre_sin_letras_usa_fallback(self):
        t = Tenant.objects.create(name="!!!")
        self.assertEqual(t.slug, "tienda")