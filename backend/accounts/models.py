from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    """Manager para crear usuarios con login por correo electrónico."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Usuario global (esquema público).

    Representa al dueño de una o varias tiendas. Vive en el esquema público
    y el login se realiza con el correo electrónico.
    """

    username = None
    objects = UserManager()
    email = models.EmailField(
        unique=True,
        verbose_name='Correo electrónico',
        help_text='Identificador único de acceso a la plataforma.',
    )
    first_name = models.CharField(
        max_length=150,
        verbose_name='Nombre(s)',
    )
    last_name = models.CharField(
        max_length=150,
        verbose_name='Apellido(s)',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'