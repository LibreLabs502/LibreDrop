from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import BillingInfo

User = get_user_model()


class BillingInfoModelTests(TestCase):
    def test_load_crea_la_fila_unica(self):
        BillingInfo.objects.all().delete()
        obj = BillingInfo.load()
        self.assertEqual(obj.pk, 1)
        self.assertEqual(BillingInfo.objects.count(), 1)

    def test_load_es_idempotente(self):
        BillingInfo.objects.all().delete()
        primero = BillingInfo.load()
        segundo = BillingInfo.load()
        self.assertEqual(primero.pk, segundo.pk)
        self.assertEqual(BillingInfo.objects.count(), 1)


class BillingInfoApiTests(APITestCase):
    url = "/payments/billing/"

    def setUp(self):
        self.owner = User.objects.create_user(username="ana", password="clave-segura-123")
        self.superuser = User.objects.create_superuser(
            username="admin", password="clave-segura-123"
        )

    def test_requiere_autenticacion(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dueno_autenticado_puede_leer(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(res.json()),
            {"bank", "account_type", "account_number", "holder", "updated_at"},
        )

    def test_dueno_no_puede_editar(self):
        self.client.force_authenticate(self.owner)
        res = self.client.put(
            self.url,
            {
                "bank": "Otro",
                "account_type": "Ahorro",
                "account_number": "999",
                "holder": "Fulano",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_superusuario_puede_editar(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.put(
            self.url,
            {
                "bank": "Banco X",
                "account_type": "Ahorro",
                "account_number": "12345678",
                "holder": "Otra Persona",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        guardado = BillingInfo.load()
        self.assertEqual(guardado.bank, "Banco X")
        self.assertEqual(guardado.account_number, "12345678")

    def test_editar_no_crea_filas_extra(self):
        self.client.force_authenticate(self.superuser)
        self.client.patch(self.url, {"bank": "Otro"}, format="json")
        self.assertEqual(BillingInfo.objects.count(), 1)

    def test_rechaza_campos_vacios(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.put(
            self.url,
            {"bank": "", "account_type": "", "account_number": "", "holder": ""},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
