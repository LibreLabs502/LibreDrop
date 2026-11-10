from decimal import Decimal, ROUND_HALF_UP

from cloudinary.models import CloudinaryField
from django.core.exceptions import ValidationError
from django.db import models

from tenants.models import Tenant

# Claves de las cinco fotos de un producto, en su orden natural.
PHOTO_FIELDS = ("image", "image2", "image3", "image4", "image5")

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

class SeasonalCategory(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="seasonalcategories")
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Seasonal Category"
        verbose_name_plural = "Seasonal Categories"

    def __str__(self) -> str:
        return f"Categoria de temporada {self.name}"


class Product(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products", null=True, blank=True)
    seasonal_category = models.ForeignKey(SeasonalCategory, on_delete=models.CASCADE, related_name="products", null=True, blank=True)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(decimal_places=2, max_digits=10, blank=True, null=True)
    # El descuento es la fuente de verdad; el precio rebajado se calcula.
    discount_percent = models.PositiveSmallIntegerField(blank=True, null=True)
    image = CloudinaryField("producto")
    image2 = CloudinaryField("producto", blank=True, null=True)
    image3 = CloudinaryField("producto", blank=True, null=True)
    image4 = CloudinaryField("producto", blank=True, null=True)
    image5 = CloudinaryField("producto", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    # Posición manual dentro de los destacados. Vacío = al final.
    featured_order = models.PositiveIntegerField(blank=True, null=True)
    # Fin opcional de la oferta. Después de esta fecha deja de mostrarse,
    # aunque el porcentaje siga guardado.
    offer_ends_at = models.DateTimeField(blank=True, null=True)
    # Orden visible de las fotos (lista de claves de PHOTO_FIELDS). Las claves
    # que falten se agregan al final en su orden natural.
    photo_order = models.JSONField(blank=True, default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return self.name

    @property
    def discounted_price(self):
        if (
            self.price is None
            or self.discount_percent is None
            or not 1 <= self.discount_percent <= 99
        ):
            return None
        discounted = self.price * (Decimal("100") - Decimal(self.discount_percent)) / Decimal("100")
        return discounted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def clean(self):
        super().clean()
        if self.discount_percent is not None:
            if (
                not isinstance(self.discount_percent, int)
                or isinstance(self.discount_percent, bool)
                or self.discount_percent < 1
                or self.discount_percent > 99
            ):
                raise ValidationError({
                    "discount_percent": "El porcentaje de descuento debe estar entre 1 y 99."
                })
        if self.offer_ends_at is not None and self.discount_percent is None:
            raise ValidationError({
                "offer_ends_at": "Para programar el fin de la oferta, primero ingresá un porcentaje de descuento."
            })

        if self.photo_order:
            if not isinstance(self.photo_order, list):
                raise ValidationError({"photo_order": "El orden de las fotos no es válido."})
            invalid = [key for key in self.photo_order if key not in PHOTO_FIELDS]
            if invalid or len(set(self.photo_order)) != len(self.photo_order):
                raise ValidationError({"photo_order": "El orden de las fotos no es válido."})
