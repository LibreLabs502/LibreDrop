from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Membership, Tenant
from .theme import DEFAULT_PALETTE, PALETTES

User = get_user_model()


class TenantSlugTests(TestCase):
    def test_crea_slug_desde_el_nombre(self):
        t = Tenant.objects.create(name="Mi Tienda")
        self.assertEqual(t.slug, "mi-tienda")

    def test_renombrar_actualiza_el_slug(self):
        t = Tenant.objects.create(name="Mi Tienda")
        t.name = "Otro Nombre"
        t.save()
        self.assertEqual(t.slug, "otro-nombre")

    def test_renombrar_a_un_slug_ocupado_agrega_sufijo(self):
        Tenant.objects.create(name="Tienda A")
        t = Tenant.objects.create(name="Tienda B")
        t.name = "Tienda A"
        t.save()
        self.assertEqual(t.slug, "tienda-a-2")

    def test_renombrar_al_mismo_slug_conserva_el_valor(self):
        t = Tenant.objects.create(name="Mi Tienda")
        t.name = "MI TIENDA"
        t.save()
        self.assertEqual(t.slug, "mi-tienda")

    def test_guardar_sin_cambiar_el_nombre_conserva_el_slug(self):
        t = Tenant.objects.create(name="Mi Tienda")
        t.description = "algo"
        t.save()
        self.assertEqual(t.slug, "mi-tienda")

    def test_renombrar_sin_letras_usa_fallback(self):
        t = Tenant.objects.create(name="Mi Tienda")
        t.name = "!!!"
        t.save()
        self.assertEqual(t.slug, "tienda")

    def test_slug_unico_al_crear(self):
        Tenant.objects.create(name="Mi Tienda")
        t2 = Tenant.objects.create(name="Mi Tienda")
        self.assertEqual(t2.slug, "mi-tienda-2")

    def test_nombre_sin_letras_usa_fallback(self):
        t = Tenant.objects.create(name="!!!")
        self.assertEqual(t.slug, "tienda")


class TenantSlugApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana", password="clave-segura-123")
        self.tenant = Tenant.objects.create(name="Tienda A")
        Membership.objects.create(user=self.user, tenant=self.tenant, role=Membership.Role.owner)
        self.client.force_authenticate(self.user)

    def test_patch_del_nombre_actualiza_el_slug(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"name": "Nueva Tienda"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["slug"], "nueva-tienda")
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.slug, "nueva-tienda")

    def test_patch_de_otro_campo_no_cambia_el_slug(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"description": "nueva descripción"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["slug"], "tienda-a")


class TenantThemeDefaultsTests(TestCase):
    def test_tienda_nueva_usa_paleta_azul(self):
        t = Tenant.objects.create(name="Nueva")
        self.assertEqual(t.theme_primary, DEFAULT_PALETTE["primary"])
        self.assertEqual(t.theme_secondary, DEFAULT_PALETTE["secondary"])
        self.assertEqual(t.theme_background, DEFAULT_PALETTE["background"])
        self.assertEqual(t.theme_text, DEFAULT_PALETTE["text"])

    def test_tienda_existente_sin_configuracion_usa_azul(self):
        # Simula un registro previo: se guardan valores por defecto al migrar.
        t = Tenant.objects.create(name="Vieja")
        t.refresh_from_db()
        self.assertEqual(t.theme_primary, "#2563EB")
        self.assertEqual(t.theme_secondary, "#DBEAFE")


class TenantThemeApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana", password="clave-segura-123")
        self.tenant = Tenant.objects.create(name="Tienda A")
        Membership.objects.create(user=self.user, tenant=self.tenant, role=Membership.Role.owner)
        self.client.force_authenticate(self.user)

    def test_listado_expone_tema_completo(self):
        res = self.client.get("/tenants/tenant/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tenant = next(t for t in res.json() if t["id"] == self.tenant.id)
        self.assertEqual(tenant["theme"]["palette"], "blue")
        self.assertEqual(set(tenant["theme"].keys()), {"palette", "primary", "secondary", "background", "text"})

    def test_actualizar_paleta_predefinida_persiste(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_palette": "green"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["theme"]["palette"], "green")
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.theme_primary, PALETTES["green"]["primary"])
        self.assertEqual(self.tenant.theme_secondary, PALETTES["green"]["secondary"])
        self.assertEqual(self.tenant.theme_background, PALETTES["green"]["background"])
        self.assertEqual(self.tenant.theme_text, PALETTES["green"]["text"])

    def test_staff_tambien_puede_actualizar(self):
        staff = User.objects.create_user(username="leo", password="clave-segura-123")
        Membership.objects.create(user=staff, tenant=self.tenant, role=Membership.Role.staff)
        self.client.force_authenticate(staff)
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_palette": "purple"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.theme_primary, PALETTES["purple"]["primary"])

    def test_rechaza_color_invalido(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_primary": "azul"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("theme_primary", res.json())
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.theme_primary, DEFAULT_PALETTE["primary"])

    def test_rechaza_hex_malformado(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_primary": "#12ZZ99"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.theme_primary, DEFAULT_PALETTE["primary"])

    def test_rechaza_paleta_desconocida(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_palette": "arcoiris"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("theme_palette", res.json())

    def test_acepta_color_personalizado_valido(self):
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_primary": "#123abc", "theme_secondary": "#ffffff"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["theme"]["palette"], None)
        self.assertEqual(res.json()["theme"]["primary"], "#123ABC")
        self.assertEqual(res.json()["theme"]["secondary"], "#FFFFFF")

    def test_usuario_sin_membresia_no_puede_modificar(self):
        intruso = User.objects.create_user(username="intruso", password="clave-segura-123")
        self.client.force_authenticate(intruso)
        res = self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_palette": "dark"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.theme_primary, DEFAULT_PALETTE["primary"])

    def test_aislamiento_entre_dos_tiendas(self):
        otra = Tenant.objects.create(name="Tienda B")
        # El usuario de A no administra B: no puede cambiarla.
        res = self.client.patch(
            f"/tenants/tenant/{otra.id}/",
            {"theme_palette": "dark"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        otra.refresh_from_db()
        self.assertEqual(otra.theme_primary, DEFAULT_PALETTE["primary"])

        # Cambiar A no afecta a B.
        self.client.patch(
            f"/tenants/tenant/{self.tenant.id}/",
            {"theme_palette": "brown"},
            format="json",
        )
        otra.refresh_from_db()
        self.assertEqual(otra.theme_primary, DEFAULT_PALETTE["primary"])

    def test_catalogo_de_paletas_requiere_sesion(self):
        self.client.force_authenticate(None)
        res = self.client.get("/tenants/palettes/")
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_catalogo_de_paletas_incluye_las_seis(self):
        res = self.client.get("/tenants/palettes/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(len(data), len(PALETTES))
        keys = {p["key"] for p in data}
        self.assertEqual(keys, set(PALETTES.keys()))
        for palette in data:
            self.assertEqual(set(palette.keys()), {"key", "label", "primary", "secondary", "background", "text"})
