from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Product, SeasonalCategory
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


class PublicStoreOffersTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Tienda Ofertas")

    def test_storefront_expone_precio_de_oferta_y_descuento(self):
        Product.objects.create(
            tenant=self.tenant,
            name="Producto en oferta",
            price="100.00",
            sales_price="80.00",
            discount_percent=20,
        )
        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.status_code, 200)
        product = res.json()["products"][0]
        self.assertEqual(product["price"], "100.00")
        self.assertEqual(product["sales_price"], "80.00")
        self.assertEqual(product["discount_percent"], 20)
        for field in ("image", "image2", "image3", "image4", "image5", "featured", "seasonal_category"):
            self.assertIn(field, product)

    def test_oferta_sin_precio_normal_expone_su_precio_de_oferta(self):
        Product.objects.create(
            tenant=self.tenant,
            name="Oferta sin precio",
            sales_price="80.00",
            discount_percent=20,
        )
        product = self.client.get(f"/public/{self.tenant.slug}/").json()["products"][0]
        self.assertIsNone(product["price"])
        self.assertEqual(product["sales_price"], "80.00")
        self.assertEqual(product["discount_percent"], 20)

    def test_producto_sin_oferta_publica_precio_de_oferta_null(self):
        Product.objects.create(tenant=self.tenant, name="Sin oferta", price="50.00")
        product = self.client.get(f"/public/{self.tenant.slug}/").json()["products"][0]
        self.assertIsNone(product["sales_price"])
        self.assertIsNone(product["discount_percent"])


class PublicStoreCollectionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(
            name="Tienda Colecciones",
            sale_text="Rebajas",
            featured_products_text="Favoritos",
        )
        self.season = SeasonalCategory.objects.create(
            tenant=self.tenant,
            name="Navidad",
        )

    def test_expone_titulos_y_categorias_de_temporada(self):
        res = self.client.get(f"/public/{self.tenant.slug}/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["sale_text"], "Rebajas")
        self.assertEqual(data["featured_products_text"], "Favoritos")
        self.assertEqual(
            data["seasonal_categories"],
            [{"id": self.season.id, "name": "Navidad"}],
        )

    def test_expone_productos_destacados_y_de_temporada(self):
        featured = Product.objects.create(
            tenant=self.tenant,
            name="Destacado",
            price="50.00",
            featured=True,
        )
        seasonal = Product.objects.create(
            tenant=self.tenant,
            name="De temporada",
            price="60.00",
            seasonal_category=self.season,
        )
        products = {
            item["name"]: item
            for item in self.client.get(f"/public/{self.tenant.slug}/").json()["products"]
        }
        self.assertTrue(products[featured.name]["featured"])
        self.assertIsNone(products[featured.name]["seasonal_category"])
        self.assertFalse(products[seasonal.name]["featured"])
        self.assertEqual(products[seasonal.name]["seasonal_category"], self.season.id)
