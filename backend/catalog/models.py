from cloudinary.models import CloudinaryField
from django.core.exceptions import ValidationError
from django.db import models

from tenants.models import Tenant

# Create your models here.
class Category(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self) -> str:
        return f"Categoria {self.name}"

class Product(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products", null=True, blank=True)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(decimal_places=2, max_digits=10, blank=True, null=True)
    sales_price = models.DecimalField(decimal_places=2, max_digits=10, blank=True, null=True)
    # Porcentaje manual para tiendas que quieren mostrar un descuento sin
    # cargar el precio normal. Si hay precio normal, se calcula solo.
    discount_percent = models.PositiveSmallIntegerField(blank=True, null=True)
    image = CloudinaryField("producto")
    image2 = CloudinaryField("producto", blank=True, null=True)
    image3 = CloudinaryField("producto", blank=True, null=True)
    image4 = CloudinaryField("producto", blank=True, null=True)
    image5 = CloudinaryField("producto", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.sales_price is not None:
            if self.sales_price <= 0:
                raise ValidationError({
                    "sales_price": "El precio de oferta debe ser mayor que cero."
                })
            # Sin precio normal se permite la oferta; en ese caso el porcentaje
            # se toma de discount_percent o se muestra solo “Oferta”.
            if self.price is not None and self.sales_price >= self.price:
                raise ValidationError({
                    "sales_price": "El precio de oferta debe ser menor que el precio normal."
                })

        if self.discount_percent is not None:
            if self.discount_percent < 1 or self.discount_percent > 99:
                raise ValidationError({
                    "discount_percent": "El porcentaje de descuento debe estar entre 1 y 99."
                })
            if self.sales_price is None:
                raise ValidationError({
                    "discount_percent": "Para usar un porcentaje de descuento, primero poné un precio de oferta."
                })
