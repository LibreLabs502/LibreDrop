# Base de Datos

Este documento describe el modelo de datos de LibreDrop: las aplicaciones, los esquemas (multi-tenant), cada modelo y el significado de sus campos.

> **Estado actual (MVP):** el proyecto está en una fase de **reseteo de modelos**. En este momento solo existen los modelos base de la plataforma: `accounts.User`, `tenants.Tenant`, `tenants.Domain` y `tenants.Membership`. Las apps `stores`, `catalog`, `customers` y `orders` están **sin modelos propios**; se diseñarán manualmente, uno por uno, en versiones futuras.

## Arquitectura multi-tenant

LibreDrop usa **django-tenants**. Cada tienda es un `Tenant` y sus datos se aíslan en un **esquema de PostgreSQL propio**.

- **Esquema público (`public`)**: datos globales de la plataforma — tenants, dominios, usuarios y membresías.
- **Esquema por tienda (uno por cada `Tenant`)**: el catálogo, clientes, pedidos y perfil de tienda se crearán por tenant cuando se definan esos modelos.

```
public (shared)
  └── tenants.Tenant, tenants.Domain, tenants.Membership, accounts.User
  └── django_tenants.middleware analiza el dominio de la petición y activa el esquema correcto

esquema "mitienda" (tenant)
  └── (sin modelos por ahora; stores, catalog, customers, orders se añaden después)
```

Cuando se crea un `Tenant`, `auto_create_schema` genera su esquema y ejecuta las migraciones de las apps `TENANT_APPS` automáticamente.

### Apps shared vs tenant

| App | Ubicación | Contenido |
| --- | --- | --- |
| `tenants` | shared | `Tenant`, `Domain`, `Membership` |
| `accounts` | shared | `User` |
| `stores` | tenant | *(sin modelos aún)* |
| `catalog` | tenant | *(sin modelos aún)* |
| `customers` | tenant | *(sin modelos aún)* |
| `orders` | tenant | *(sin modelos aún)* |

> En el MVP el cobro se gestiona por fuera de la plataforma (WhatsApp); un seguimiento de pagos se agregará en una futura versión.

---

## Esquema público (shared)

### `tenants.Tenant`

Registro de la tienda en el esquema público. Cada `Tenant` genera y posee un esquema de PostgreSQL propio.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `schema_name` | `CharField(63)`, único | Subdominio que identifica a la tienda, p. ej. `mitienda` para `mitienda.libredrop.app`. Heredado de `TenantMixin`. |
| `name` | `CharField(200)` | Nombre comercial del tenant. |

- `auto_create_schema = True`: al guardar el registro se crea el esquema y se migran las apps tenant.

### `tenants.Domain`

Dominio o subdominio asociado a un tenant, proveniente del mixin `DomainMixin`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `domain` | `CharField(253)`, único | Dominio completo, p. ej. `mitienda.libredrop.app`. |
| `tenant` | `FK → tenants.Tenant` | Tienda a la que pertenece el dominio. |
| `is_primary` | `BooleanField` | Indica si es el dominio principal de la tienda. |

### `tenants.Membership`

Relación global que indica a qué tiendas (`Tenant`) pertenece un usuario de la plataforma (`accounts.User`) y con qué rol. Vive en el esquema `public` junto a `User` y `Tenant`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `user` | `FK → accounts.User` (`CASCADE`) | Usuario de la plataforma. |
| `tenant` | `FK → tenants.Tenant` (`CASCADE`) | Tienda a la que el usuario pertenece. |
| `role` | `CharField(200)` | Rol dentro de la tienda (texto libre por ahora). |

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

## Esquema tenant (por tienda)

*(En construcción)* Las apps `stores`, `catalog`, `customers` y `orders` están registradas como `TENANT_APPS` y sus futuros modelos se crearán en el esquema de cada tienda, pero todavía **no tienen modelos propios**.

Mientras no existan modelos propios, no generan migraciones y no crean tablas en los esquemas de tenant.

---

## Relaciones principales

```
User 1──* Membership *──1 Tenant
Tenant 1──* Domain
```

---

## Notas

- `membership` (en `tenants/models.py`) importa `get_user_model` sin usarlo directamente; las FKs referencian los modelos por string (`"accounts.User"` / `"tenants.Tenant"`).
- Los `related_name` de ambas FKs de `Membership` usan `membership` (singular), por lo que el acceso reverso es `user.membership` y `tenant.membership` (con `.get()`).
