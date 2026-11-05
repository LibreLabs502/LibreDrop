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
        if self.sales_price is None:
            return
        if self.price is None:
            raise ValidationError({
                "sales_price": "Para poner una oferta, el producto debe tener un precio normal."
            })
        if self.sales_price <= 0:
            raise ValidationError({
                "sales_price": "El precio de oferta debe ser mayor que cero."
            })
        if self.sales_price >= self.price:
            raise ValidationError({
                "sales_price": "El precio de oferta debe ser menor que el precio normal."
            })
