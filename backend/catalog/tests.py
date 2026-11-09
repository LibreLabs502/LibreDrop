from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient, APIRequestFactory

from tenants.models import Membership, Subscription, Tenant

from .models import Product
from .serializers import ProductSerializer

User = get_user_model()

# PNG 1x1 transparente: alcanza para que el ImageField del producto valide.
PNG_1X1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000a49444154789c6360000002000154a24f5f0000000049454e44ae"
    "426082"
)


def product_serializer(data):
    """ProductSerializer con el contexto mínimo que espera validate_category."""
    request = APIRequestFactory().post("/")
    view = SimpleNamespace(kwargs={"tenant_id": 1})
    payload = {
        "image": SimpleUploadedFile("producto.png", PNG_1X1, content_type="image/png"),
        **data,
    }
    return ProductSerializer(data=payload, context={"request": request, "view": view})


class ProductOfferValidationTests(TestCase):
    def test_oferta_valida_con_precio_normal(self):
        serializer = product_serializer(
            {"name": "Producto", "price": "100.00", "sales_price": "80.00"}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_oferta_valida_sin_precio_normal(self):
        serializer = product_serializer({"name": "Producto", "sales_price": "80.00"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_porcentaje_manual_requiere_precio_de_oferta(self):
        serializer = product_serializer({"name": "Producto", "discount_percent": 20})
        self.assertFalse(serializer.is_valid())
        self.assertIn("discount_percent", serializer.errors)

    def test_porcentaje_manual_valido_junto_al_precio_de_oferta(self):
        serializer = product_serializer(
            {"name": "Producto", "sales_price": "80.00", "discount_percent": 20}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_producto_sin_oferta_es_valido(self):
        serializer = product_serializer({"name": "Producto", "price": "100.00"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_precio_de_oferta_mayor_o_igual_al_normal_es_invalido(self):
        for sales_price in ("100.00", "120.00"):
            serializer = product_serializer(
                {"name": "Producto", "price": "100.00", "sales_price": sales_price}
            )
            self.assertFalse(serializer.is_valid(), sales_price)
            self.assertIn("sales_price", serializer.errors)

    def test_precio_de_oferta_debe_ser_positivo(self):
        serializer = product_serializer({"name": "Producto", "sales_price": "0"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("sales_price", serializer.errors)

    def test_porcentaje_vacio_se_convierte_en_null(self):
        serializer = product_serializer({"name": "Producto", "discount_percent": ""})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data["discount_percent"])

    def test_precio_de_oferta_vacio_se_convierte_en_null(self):
        serializer = product_serializer(
            {"name": "Producto", "price": "100.00", "sales_price": ""}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data["sales_price"])

    def test_porcentaje_fuera_de_rango_o_no_entero_es_invalido(self):
        for percent in (0, 100, 20.5):
            serializer = product_serializer(
                {"name": "Producto", "sales_price": "80.00", "discount_percent": percent}
            )
            self.assertFalse(serializer.is_valid(), percent)
            self.assertIn("discount_percent", serializer.errors)

    def test_sales_price_es_campo_de_api(self):
        serializer = product_serializer(
            {"name": "Producto", "price": "100.00", "sales_price": "80.00"}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["sales_price"], Decimal("80.00"))

    def test_acepta_hasta_cinco_fotos(self):
        serializer = product_serializer({
            "name": "Producto",
            "image2": SimpleUploadedFile("foto2.png", PNG_1X1, content_type="image/png"),
            "image3": SimpleUploadedFile("foto3.png", PNG_1X1, content_type="image/png"),
            "image4": SimpleUploadedFile("foto4.png", PNG_1X1, content_type="image/png"),
            "image5": SimpleUploadedFile("foto5.png", PNG_1X1, content_type="image/png"),
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        for field in ("image", "image2", "image3", "image4", "image5"):
            self.assertIn(field, serializer.validated_data)

    def test_fin_de_oferta_requiere_precio_de_oferta(self):
        serializer = product_serializer(
            {"name": "Producto", "offer_ends_at": "2030-01-01T10:00:00Z"}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("offer_ends_at", serializer.errors)

    def test_fin_de_oferta_valido_junto_al_precio_de_oferta(self):
        serializer = product_serializer({
            "name": "Producto",
            "sales_price": "80.00",
            "offer_ends_at": "2030-01-01T10:00:00Z",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNotNone(serializer.validated_data["offer_ends_at"])

    def test_fin_de_oferta_vacio_se_convierte_en_null(self):
        serializer = product_serializer(
            {"name": "Producto", "sales_price": "80.00", "offer_ends_at": ""}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data["offer_ends_at"])

    def test_orden_de_fotos_valido(self):
        serializer = product_serializer({
            "name": "Producto",
            "photo_order": ["image3", "image", "image5"],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data["photo_order"], ["image3", "image", "image5"]
        )

    def test_orden_de_fotos_acepta_json_de_formulario(self):
        serializer = product_serializer({
            "name": "Producto",
            "photo_order": '["image2", "image"]',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["photo_order"], ["image2", "image"])

    def test_orden_de_fotos_invalido(self):
        for photo_order in (
            ["image", "otra"],
            ["image", "image"],
            "no-es-json",
            {"image": 1},
        ):
            serializer = product_serializer({
                "name": "Producto",
                "photo_order": photo_order,
            })
            self.assertFalse(serializer.is_valid(), photo_order)
            self.assertIn("photo_order", serializer.errors)


class ProductOfferModelTests(TestCase):
    def test_clean_acepta_porcentaje_valido_con_precio_de_oferta(self):
        Product(price=Decimal("100.00"), sales_price=Decimal("80.00"), discount_percent=20).clean()
        Product(sales_price=Decimal("80.00"), discount_percent=20).clean()

    def test_clean_rechaza_porcentaje_sin_precio_de_oferta(self):
        with self.assertRaises(ValidationError):
            Product(discount_percent=20).clean()

    def test_clean_rechaza_porcentaje_fuera_de_rango(self):
        for percent in (0, 100, 20.5):
            with self.assertRaises(ValidationError):
                Product(sales_price=Decimal("80.00"), discount_percent=percent).clean()

    def test_clean_rechaza_oferta_mayor_al_precio(self):
        with self.assertRaises(ValidationError):
            Product(price=Decimal("100.00"), sales_price=Decimal("100.00")).clean()

    def test_clean_rechaza_fin_de_oferta_sin_precio_de_oferta(self):
        with self.assertRaises(ValidationError):
            Product(offer_ends_at=timezone.now()).clean()

    def test_clean_acepta_fin_de_oferta_con_precio_de_oferta(self):
        Product(
            sales_price=Decimal("80.00"),
            offer_ends_at=timezone.now(),
        ).clean()

    def test_clean_rechaza_orden_de_fotos_invalido(self):
        for photo_order in (["image", "otra"], ["image", "image"]):
            with self.assertRaises(ValidationError):
                Product(photo_order=photo_order).clean()


class ProductReorderFeaturedTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="ana", password="clave-segura-123")
        self.tenant = Tenant.objects.create(name="Tienda Orden")
        Membership.objects.create(
            user=self.user, tenant=self.tenant, role=Membership.Role.owner
        )
        self.subscription = Subscription.objects.create(
            tenant=self.tenant,
            current_period_end=timezone.now() + timedelta(days=30),
        )
        self.client.force_authenticate(self.user)
        self.uno = Product.objects.create(tenant=self.tenant, name="Uno", price="10.00")
        self.dos = Product.objects.create(tenant=self.tenant, name="Dos", price="20.00")
        self.tres = Product.objects.create(tenant=self.tenant, name="Tres", price="30.00")

    def reorder(self, ids):
        return self.client.post(
            f"/catalog/tenants/{self.tenant.id}/products/reorder-featured/",
            {"ids": ids},
            format="json",
        )

    def test_guarda_el_orden_y_marca_destacados(self):
        res = self.reorder([self.tres.id, self.uno.id])
        self.assertEqual(res.status_code, 200)
        self.tres.refresh_from_db()
        self.uno.refresh_from_db()
        self.dos.refresh_from_db()
        self.assertEqual(self.tres.featured_order, 0)
        self.assertEqual(self.uno.featured_order, 1)
        self.assertTrue(self.tres.featured)
        self.assertTrue(self.uno.featured)
        self.assertIsNone(self.dos.featured_order)

    def test_rechaza_lista_vacia(self):
        self.assertEqual(self.reorder([]).status_code, 400)

    def test_rechaza_repetidos(self):
        self.assertEqual(self.reorder([self.uno.id, self.uno.id]).status_code, 400)

    def test_rechaza_producto_de_otra_tienda(self):
        otra = Tenant.objects.create(name="Otra tienda")
        ajeno = Product.objects.create(tenant=otra, name="Ajeno", price="10.00")
        self.assertEqual(self.reorder([ajeno.id]).status_code, 400)

    def test_permita_gestionar_durante_los_diez_dias_de_gracia(self):
        self.subscription.current_period_end = timezone.now() - timedelta(days=9)
        self.subscription.save(update_fields=["current_period_end"])
        self.assertEqual(self.reorder([self.uno.id]).status_code, 200)

    def test_bloquea_gestion_despues_de_los_diez_dias_de_gracia(self):
        self.subscription.current_period_end = timezone.now() - timedelta(days=10, seconds=1)
        self.subscription.save(update_fields=["current_period_end"])
        self.assertEqual(self.reorder([self.uno.id]).status_code, 403)
