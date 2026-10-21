from django.db import models
from cloudinary.models import CloudinaryField
from django.utils.text import slugify

from django.conf import settings

from .theme import DEFAULT_PALETTE, validate_hex_color

class Tenant(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    logo = CloudinaryField("logo")
    whatsapp = models.CharField(max_length=20, blank=True, null=True, default="")
    instagram_url = models.URLField(blank=True, null=True, default="")
    facebook_url = models.URLField(blank=True, null=True, default="")
    tiktok_url = models.URLField(blank=True, null=True, default="")
    linkedin_url = models.URLField(blank=True, null=True, default="")

    # Canales de compra activados por la tienda (lista de claves, ver channels.py).
    # Por defecto vacío: cada negocio elige por dónde recibe pedidos. Las tiendas
    # que ya existían se completan en la migración de datos con los canales que
    # usaban hasta ahora (WhatsApp), para no cambiar su comportamiento.
    purchase_channels = models.JSONField(default=list, blank=True)

    # Configuración visual propia de cada tienda. Los valores por defecto son
    # la paleta azul, así que las tiendas existentes no cambian de apariencia.
    theme_primary = models.CharField(
        max_length=7,
        default=DEFAULT_PALETTE["primary"],
        validators=[validate_hex_color],
    )
    theme_secondary = models.CharField(
        max_length=7,
        default=DEFAULT_PALETTE["secondary"],
        validators=[validate_hex_color],
    )
    theme_background = models.CharField(
        max_length=7,
        default=DEFAULT_PALETTE["background"],
        validators=[validate_hex_color],
    )
    theme_text = models.CharField(
        max_length=7,
        default=DEFAULT_PALETTE["text"],
        validators=[validate_hex_color],
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"

    def __str__(self) -> str:
        return f"Tenant {self.name}"

    def save(self, *args, **kwargs):
        # El slug acompaña al nombre: se genera al crear la tienda y se
        # regenera cuando cambia el nombre, manteniéndolo único (-2, -3, ...).
        previous_name = None
        if self.pk is not None:
            previous_name = (
                Tenant.objects.filter(pk=self.pk)
                .values_list("name", flat=True)
                .first()
            )
        name_changed = previous_name is not None and previous_name != self.name
        if not self.slug or name_changed:
            self.slug = self._unique_slug(self.name, exclude_pk=self.pk)
            # Si el guardado es parcial, incluimos el slug para que persista.
            if kwargs.get("update_fields") is not None:
                kwargs["update_fields"] = set(kwargs["update_fields"]) | {"slug"}
        return super().save(*args, **kwargs)

    @classmethod
    def _unique_slug(cls, name, exclude_pk=None):
        """Slug del nombre, con sufijo -2, -3, ... si ya está ocupado."""
        base_slug = slugify(name) or "tienda"
        slug = base_slug
        counter = 2
        qs = cls.objects.all()
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        while qs.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

class Membership(models.Model):
    class Role(models.TextChoices):
        owner = "OWNER"
        staff = "STAFF"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=200, choices=Role, default=Role.owner)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["tenant", "user"], name="unique_tenant_user")
        ]


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Activa"
        PAST_DUE = "past_due", "Vencida"
        SUSPENDED = "suspended", "Suspendida"

    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.PROTECT,
        related_name="subscription",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    current_period_end = models.DateTimeField()
    suspended_at = models.DateTimeField(
        null=True,
        blank=True,
    )
