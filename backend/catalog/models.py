from cloudinary.models import CloudinaryField
from django.db import models


class Category(models.Model):
    """Categoría para agrupar los productos de la tienda."""

    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre de la categoría, p. ej. "Ropa", "Accesorios".',
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        verbose_name='Slug',
        help_text='Identificador amigable para URL, p. ej. "ropa".',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activa',
        help_text='Si está desmarcada, la categoría no se muestra.',
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['name']


class Product(models.Model):
    """Producto publicado en la tienda."""

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name='Categoría',
        help_text='Categoría a la que pertenece el producto.',
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del producto.',
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        verbose_name='Slug',
        help_text='Identificador amigable para URL.',
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Detalle del producto mostrado en la tienda.',
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio',
        help_text='Precio de venta del producto en la moneda de la tienda.',
    )
    compare_at_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio anterior',
        help_text='Precio tachado con fines promocionales (opcional).',
    )
    image = CloudinaryField(
        'Imagen del producto',
        null=True,
        blank=True,
        help_text='Imagen principal del producto almacenada en Cloudinary.',
    )
    quantity = models.PositiveIntegerField(
        default=0,
        verbose_name='Cantidad disponible',
        help_text='Existencias simples del producto. Sin control de inventario.',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Soft-delete: si está desmarcada, el producto se oculta pero sus pedidos se conservan.',
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name='Destacado',
        help_text='Si está marcado, se muestra en la sección destacada de la tienda.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización',
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['name']