from decimal import Decimal
from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from .models import Product
from .serializers import ProductSerializer

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
