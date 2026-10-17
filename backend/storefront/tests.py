from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from tenants.models import Membership, Tenant
from tenants.theme import DEFAULT_PALETTE, PALETTES

User = get_user_model()


class PublicStoreThemeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="ana", password="clave-segura-123")
        self.tenant = Tenant.objects.create(name="Tienda Publica")
        Membership.objects.create(user=self.user, tenant=self.tenant, role=Membership.Role.owner)

    def test_tienda_nueva_expone_tema_azul(self):
        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["theme"]["palette"], "blue")
        self.assertEqual(data["theme"]["primary"], DEFAULT_PALETTE["primary"])
        self.assertEqual(data["theme"]["secondary"], DEFAULT_PALETTE["secondary"])

    def test_tema_refleja_la_paleta_guardada(self):
        self.tenant.theme_primary = PALETTES["green"]["primary"]
        self.tenant.theme_secondary = PALETTES["green"]["secondary"]
        self.tenant.theme_background = PALETTES["green"]["background"]
        self.tenant.theme_text = PALETTES["green"]["text"]
        self.tenant.save()

        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.json()["theme"]["palette"], "green")

    def test_endpoint_publico_no_expone_datos_privados(self):
        res = self.client.get(f"/public/{self.tenant.slug}/")
        data = res.json()
        # No debe incluir usuarios, membresías ni campos internos.
        self.assertNotIn("memberships", data)
        self.assertNotIn("members", data)
        self.assertNotIn("theme_primary", data)
        self.assertEqual(set(data["theme"].keys()), {"palette", "primary", "secondary", "background", "text"})


class PublicStoreChannelsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="ana", password="clave-segura-123")
        self.tenant = Tenant.objects.create(name="Tienda Canales")
        Membership.objects.create(user=self.user, tenant=self.tenant, role=Membership.Role.owner)

    def test_sin_canales_no_expone_botones(self):
        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["purchase_channels"], [])

    def test_expone_canal_activo_con_destino_valido(self):
        self.tenant.whatsapp = "+50212345678"
        self.tenant.purchase_channels = ["whatsapp"]
        self.tenant.save()
        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.json()["purchase_channels"], ["whatsapp"])

    def test_no_expone_canal_activo_sin_destino(self):
        self.tenant.whatsapp = ""
        self.tenant.instagram_url = "https://instagram.com/tienda"
        self.tenant.purchase_channels = ["whatsapp", "instagram"]
        self.tenant.save()
        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.json()["purchase_channels"], ["instagram"])

    def test_no_expone_canal_con_datos_pero_inactivo(self):
        self.tenant.whatsapp = "+50212345678"
        self.tenant.instagram_url = "https://instagram.com/tienda"
        self.tenant.purchase_channels = ["whatsapp"]
        self.tenant.save()
        res = self.client.get(f"/public/{self.tenant.slug}/")
        # Instagram tiene datos, pero el dueño no lo activó: no se muestra.
        self.assertEqual(res.json()["purchase_channels"], ["whatsapp"])
