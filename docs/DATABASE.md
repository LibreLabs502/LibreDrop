# Base de Datos

Este documento describe el modelo de datos de LibreDrop: las aplicaciones, los esquemas (multi-tenant), cada modelo y el significado de sus campos.

## Arquitectura multi-tenant

LibreDrop usa **django-tenants**. Cada tienda es un `Tenant` y sus datos se aíslan en un **esquema de PostgreSQL propio**.

- **Esquema público (`public`)**: datos globales de la plataforma — tenants, dominios, usuarios y membresías.
- **Esquema por tienda (uno por cada `Tenant`)**: el catálogo (categorías y productos) vive en el esquema de cada tienda. Clientes y pedidos se añadirán cuando se definan esos modelos.

```
public (shared)
  └── tenants.Tenant, tenants.Domain, tenants.Membership, accounts.User
  └── django_tenants.middleware analiza el dominio de la petición y activa el esquema correcto

esquema "mitienda" (tenant)
  └── catalog.Category, catalog.Product
  └── (customers, orders se añaden después)
```

Cuando se crea un `Tenant`, `auto_create_schema` genera su esquema y ejecuta las migraciones de las apps `TENANT_APPS` automáticamente. El registro de un usuario crea la tienda, su esquema y su dominio en un solo paso (ver [Registro y creación automática de tienda](#registro-y-creacion-automatica-de-tienda)).

### Apps shared vs tenant

| App | Ubicación | Contenido |
| --- | --- | --- |
| `tenants` | shared | `Tenant`, `Domain`, `Membership` |
| `accounts` | shared | `User` |
| `catalog` | tenant | `Category`, `Product` |
| `customers` | tenant | *(sin modelos aún)* |
| `orders` | tenant | *(sin modelos aún)* |

> En el MVP el cobro se gestiona por fuera de la plataforma (WhatsApp); un seguimiento de pagos se agregará en una futura versión.

---

## Esquema público (shared)

### `tenants.Tenant`

Registro de la tienda en el esquema público. Cada `Tenant` genera y posee un esquema de PostgreSQL propio.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `schema_name` | `CharField(63)`, único | Subdominio que identifica a la tienda, p. ej. `mitienda` para `mitienda.libredrop.localhost`. Heredado de `TenantMixin`. |
| `name` | `CharField(200)` | Nombre comercial del tenant. |
| `description` | `TextField`, opcional | Descripción de la tienda. |
| `phone` | `CharField(20)` | Teléfono de contacto de la tienda (donde se reciben los pedidos por WhatsApp). |
| `email` | `EmailField`, opcional | Correo de contacto de la tienda. |
| `logo` | `CloudinaryField`, opcional | Logo de la tienda almacenado en Cloudinary. |

- `auto_create_schema = True`: al guardar el registro se crea el esquema y se migran las apps tenant.

### `tenants.Domain`

Dominio o subdominio asociado a un tenant, proveniente del mixin `DomainMixin`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `domain` | `CharField(253)`, único | Dominio completo, p. ej. `mitienda.libredrop.localhost` en desarrollo. |
| `tenant` | `FK → tenants.Tenant` | Tienda a la que pertenece el dominio. |
| `is_primary` | `BooleanField` | Indica si es el dominio principal de la tienda. |

> En desarrollo los dominios de tenant usan la zona `*.libredrop.localhost`, para lo cual hay que mapear `libredrop.localhost` a `127.0.0.1` en `/etc/hosts` (p. ej. `127.0.0.1 mitienda.libredrop.localhost`). En producción se usará el dominio real de cada tienda.

### `tenants.Membership`

Relación global que indica a qué tiendas (`Tenant`) pertenece un usuario de la plataforma (`accounts.User`) y con qué rol. Vive en el esquema `public` junto a `User` y `Tenant`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `user` | `FK → accounts.User` (`CASCADE`) | Usuario de la plataforma. |
| `tenant` | `FK → tenants.Tenant` (`CASCADE`) | Tienda a la que el usuario pertenece. |
| `role` | `CharField(20)` con `TextChoices` | Rol dentro de la tienda: `OWNER` o `STAFF`. Por defecto `OWNER`. |

- **Unicidad:** existe la constraint `unique_user_tenant_membership` sobre `(user, tenant)`: un usuario solo puede tener una membresía por tienda.
- La relación es simétrica: `user.memberships` y `tenant.memberships`.

### `accounts.User`

Usuario global de la plataforma (dueño/administrador de una o varias tiendas). Extiende `AbstractUser` de Django. El login se realiza con `username` y `password` (método estándar de Django).

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `username` | `CharField(150)`, único | Identificador de acceso. |
| `email` | `EmailField`, opcional | Correo electrónico. |
| `first_name` / `last_name` | `CharField(150)` | Nombre y apellido. |
| `password` | (heredado) | Contraseña con hash de Django. |
| `is_staff` / `is_superuser` | (heredado) | Permisos de admin. |

> **Nota:** `AUTH_USER_MODEL = 'accounts.User'`. Se guarda en el esquema `public` (está en `SHARED_APPS`); la autenticación usa JWT (djangorestframework-simplejwt) y permite el blacklist de tokens de refresco (`rest_framework_simplejwt.token_blacklist`).

---

## Registro y creación automática de tienda

Al registrarse un nuevo usuario (`POST /accounts/register/`), el `RegisterSerializer` realiza en una sola transacción atómica:

1. Crea el usuario (`accounts.User`).
2. Crea el `Tenant` con `schema_name` basado en `tenant_name` (slug separado por `-`, convertido a `_`); `auto_create_schema` genera el esquema.
3. Crea la `Membership` entre el usuario y la tienda con rol `OWNER`.
4. Crea el `Domain` primario `{slug}.libredrop.localhost`.

El mismo flujo se aplica al crear una tienda vía API: `TenantViewSet.perform_create` (con `TenantCreateSerializer`) crea la tienda y su esquema y asocia al usuario autenticado como `OWNER` (el dominio se debe agregar por separado vía `/domains/`).

## API de tenants

El router de `tenants` expone tres viewsets bajo `backend.urls` (y `backend.urls_public` para el esquema `public`):

| Endpoint | Acciones | Permisos |
| --- | --- | --- |
| `/tenants/` | CRUD de tiendas del usuario autenticado | Lista/ver: autenticado (miembro). Crear/actualizar/eliminar: `IsTenantMember` / propietario |
| `/domains/` | CRUD de dominios del tenant actual | Lista/ver: `IsTenantMember`; crear/actualizar/eliminar: `IsTenantOwner` |
| `/memberships/` | CRUD de membresías del tenant actual | Lista/ver: `IsTenantMember`; crear/actualizar/eliminar: `IsTenantOwner` |

Los viewsets de `Domain` y `Membership` siempre operan sobre el tenant de la petición (`request.tenant`), de modo que cada tienda solo ve y administra sus propios dominios y miembros.

> En el esquema `public` solo se sirven los recursos globales (`/accounts/`, `admin/` y `/tenants/`); cuando una petición llega a un dominio de tenant se activa su esquema y se sirve la misma URLconf (`backend.urls`). `SHOW_PUBLIC_IF_NO_TENANT_FOUND = True` muestra el esquema público si no hay un tenant coincidente.

---

## Esquema tenant (por tienda)

En cada esquema de tienda se crean los modelos de las apps declaradas en `TENANT_APPS`.

### `catalog.Category`

Categoría de productos de la tienda.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `AutoField` | Identificador. |
| `name` | `CharField(255)` | Nombre de la categoría. |
| `description` | `TextField`, opcional | Descripción de la categoría. |

### `catalog.Product`

Producto de la tienda, asociado a una categoría.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `AutoField` | Identificador. |
| `name` | `CharField(200)` | Nombre del producto. |
| `description` | `TextField`, opcional | Descripción del producto. |
| `price` | `DecimalField(10, 2)` | Precio del producto. |
| `image` | `CloudinaryField`, opcional | Imagen del producto almacenada en Cloudinary. |
| `category` | `FK → catalog.Category` (`CASCADE`) | Categoría a la que pertenece (acceso reverso `category.products`). |
| `created_at` | `DateTimeField(auto_now_add)` | Fecha de creación. |
| `updated_at` | `DateTimeField(auto_now)` | Fecha de última actualización. |

> Las apps `customers` y `orders` no tienen modelos propios todavía; cuando se definan, sus tablas se crearán en el esquema de cada tienda.

---

## Relaciones principales

```
User 1──* Membership *──1 Tenant
Tenant 1──* Domain
Category 1──* Product
```

---

## Notas

- Los `related_name` de ambas FKs de `Membership` son `memberships` (plural): `user.memberships` y `tenant.memberships`.
- Los roles de `Membership.Role` (`OWNER`, `STAFF`) se definen como `TextChoices` en `tenants/models.py`.
