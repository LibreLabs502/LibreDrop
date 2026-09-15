# LibreDrop v1.0

## Objetivo

LibreDrop es una plataforma open source para crear tiendas online simples. La versión v1.0 (MVP) está diseñada para que emprendedores puedan crear una tienda, publicar sus productos y recibir pedidos mediante WhatsApp, eliminando la necesidad de infraestructura compleja o pasarelas de pago desde el inicio.

## Estado

**El backend de v1 está terminado.** Quedó implementada la plataforma multi-tenant con registro en un solo paso, gestión de tiendas/dominios/miembros y la API de catálogo (categorías y productos). Las apps `customers` y `orders` siguen registradas como apps tenant pero **sin modelos propios**; no se tocarán por ahora y se construirán en futuras versiones.

## Multi-tenancy

Usamos **django-tenants** para el aislamiento de datos por tienda. Cada tienda es un `Tenant` con un esquema de PostgreSQL propio; el middleware activa el esquema según el dominio de la petición.

## Estado actual de modelos

### Esquema público (shared)

```
accounts
└── User (AbstractUser)

tenants
├── Tenant  (TenantMixin; name, description, phone, email, logo + auto_create_schema)
├── Domain  (DomainMixin)
└── Membership (User ↔ Tenant, role OWNER | STAFF, único por usuario+tienda)
```

### Esquema por tienda (tenant)

```
catalog
├── Category (name, description)
└── Product (name, description, price, image, category → Category, created_at, updated_at)
```

`customers` y `orders` están registradas como apps tenant pero **sin modelos propios** todavía. No se tocarán por ahora; se construirán en futuras versiones.

## Registro

`POST /accounts/register/` crea en un solo paso (transacción atómica): el usuario, su tienda (`Tenant`), el esquema de PostgreSQL (`auto_create_schema`), el dominio primario `{slug}.libredrop.localhost` y la membresía `OWNER`.

## API de tenants

- `GET/POST /tenants/` — listar/crear tiendas del usuario autenticado (al crear se asocia como `OWNER`).
- `/domains/` — administrar dominios del tenant de la petición.
- `/memberships/` — administrar miembros del tenant de la petición.

Permisos: `IsTenantMember` para lectura, `IsTenantOwner` para escritura. En desarrollo los dominios de tenant usan la zona `*.libredrop.localhost` (mapear a `127.0.0.1` en `/etc/hosts`).

## API de catálogo

Los viewsets de `catalog` se exponen en la URLconf `backend.urls` (y `backend.urls_public`):

| Endpoint | Acciones |
| --- | --- |
| `/category/` | CRUD de categorías del tenant actual |
| `/products/` | CRUD de productos del tenant actual |

Permisos: `AllowAny` para lecturas (`list`/`retrieve`); `IsAuthenticated` + `IsTenantMember` para crear, actualizar y eliminar. Como viven en `TENANT_APPS`, categorías y productos se guardan en el esquema de cada tienda.