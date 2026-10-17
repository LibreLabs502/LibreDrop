import importlib

from django.apps import apps as django_apps
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .channels import (
    CHANNEL_KEYS,
    effective_channels,
    is_valid_destination,
    normalize_channels,
)
from .models import Membership, Tenant

User = get_user_model()


class ChannelsHelpersTests(TestCase):
    def test_normaliza_orden_y_quita_repetidos(self):
        self.assertEqual(
            normalize_channels(["facebook", "whatsapp", "facebook"]),
            ["whatsapp", "facebook"],
        )

    def test_descarta_canales_desconocidos_y_vacios(self):
        self.assertEqual(normalize_channels(["instagram", "linkedin", "", "x"]), ["instagram"])

    def test_normaliza_valor_vacio(self):
        self.assertEqual(normalize_channels(None), [])
        self.assertEqual(normalize_channels([]), [])

    def test_whatsapp_valido_con_digitos(self):
        self.assertTrue(is_valid_destination("whatsapp", "502 1234 5678"))
        self.assertFalse(is_valid_destination("whatsapp", "sin numero"))
        self.assertFalse(is_valid_destination("whatsapp", ""))

    def test_redes_necesitan_url_http(self):
        self.assertTrue(is_valid_destination("instagram", "https://instagram.com/tienda"))
        self.assertFalse(is_valid_destination("instagram", "instagram.com/tienda"))
        self.assertFalse(is_valid_destination("tiktok", ""))

    def test_effective_channels_solo_devuelve_validos(self):
        tenant = Tenant(
            name="Tienda",
            whatsapp="50212345678",
            instagram_url="",
            purchase_channels=["whatsapp", "instagram"],
        )
        self.assertEqual(effective_channels(tenant), ["whatsapp"])


class PurchaseChannelsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana", password="clave-segura-123")
        self.tenant = Tenant.objects.create(name="Tienda A")
        Membership.objects.create(user=self.user, tenant=self.tenant, role=Membership.Role.owner)
        self.client.force_authenticate(self.user)

    def _patch(self, payload):
        return self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/", payload, format="json"
        )

    def test_tienda_nueva_no_tiene_canales(self):
        self.assertEqual(self.tenant.purchase_channels, [])

    def test_listado_expone_canales(self):
        res = self.client.get("/tenants/tenant/")
        tenant = next(t for t in res.json() if t["id"] == self.tenant.id)
        self.assertEqual(tenant["purchase_channels"], [])

    def test_activa_whatsapp_con_numero(self):
        res = self._patch(
            {"whatsapp": "+50212345678", "purchase_channels": ["whatsapp"]}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["purchase_channels"], ["whatsapp"])
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.purchase_channels, ["whatsapp"])

    def test_rechaza_whatsapp_sin_numero(self):
        res = self._patch({"purchase_channels": ["whatsapp"]})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("purchase_channels", res.json())
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.purchase_channels, [])

    def test_activa_instagram_con_enlace(self):
        res = self._patch(
            {
                "instagram_url": "https://instagram.com/tienda",
                "purchase_channels": ["instagram"],
            }
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.purchase_channels, ["instagram"])

    def test_rechaza_instagram_sin_enlace(self):
        res = self._patch({"purchase_channels": ["instagram"]})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("purchase_channels", res.json())

    def test_rechaza_canal_desconocido(self):
        res = self._patch(
            {"whatsapp": "+50212345678", "purchase_channels": ["linkedin"]}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("purchase_channels", res.json())

    def test_no_puede_quitar_el_dato_de_un_canal_activo(self):
        self.tenant.whatsapp = "+50212345678"
        self.tenant.purchase_channels = ["whatsapp"]
        self.tenant.save()
        res = self._patch({"whatsapp": None})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.whatsapp, "+50212345678")

    def test_puede_quitar_el_dato_si_desactiva_el_canal(self):
        self.tenant.whatsapp = "+50212345678"
        self.tenant.purchase_channels = ["whatsapp"]
        self.tenant.save()
        res = self._patch({"whatsapp": None, "purchase_channels": []})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.whatsapp, None)
        self.assertEqual(self.tenant.purchase_channels, [])

    def test_normaliza_y_ordena_al_guardar(self):
        res = self._patch(
            {
                "whatsapp": "+50212345678",
                "facebook_url": "https://facebook.com/tienda",
                "purchase_channels": ["facebook", "whatsapp", "facebook"],
            }
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["purchase_channels"], ["whatsapp", "facebook"])

    def test_editar_otro_campo_no_revalida_los_canales(self):
        self.tenant.whatsapp = "+50212345678"
        self.tenant.purchase_channels = ["whatsapp"]
        self.tenant.save()
        res = self._patch({"name": "Tienda A renombrada"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.name, "Tienda A renombrada")
        self.assertEqual(self.tenant.purchase_channels, ["whatsapp"])

    def test_acepta_lista_vacia_en_formulario_multipart(self):
        # El panel manda "" para representar "sin canales" en multipart.
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"purchase_channels": ""},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.purchase_channels, [])

    def test_intruso_no_puede_configurar_canales(self):
        intruso = User.objects.create_user(username="intruso", password="clave-segura-123")
        self.client.force_authenticate(intruso)
        res = self._patch({"whatsapp": "+50212345678", "purchase_channels": ["whatsapp"]})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.purchase_channels, [])

    def test_todas_las_claves_disponibles_son_validas(self):
        self.assertEqual(set(CHANNEL_KEYS), {"whatsapp", "instagram", "facebook", "tiktok"})


class DefaultChannelsMigrationTests(TestCase):
    def test_tienda_con_whatsapp_recibe_el_canal(self):
        module = importlib.import_module(
            "tenants.migrations.0011_default_purchase_channels"
        )
        con_numero = Tenant.objects.create(name="Con numero", whatsapp="+50212345678")
        sin_numero = Tenant.objects.create(name="Sin numero")
        module.set_default_purchase_channels(django_apps, None)
        con_numero.refresh_from_db()
        sin_numero.refresh_from_db()
        self.assertEqual(con_numero.purchase_channels, ["whatsapp"])
        self.assertEqual(sin_numero.purchase_channels, [])
