# API

Base URL: `/` (dev: `http://localhost:8000`). Auth JWT en header `Authorization: Bearer <access>` salvo endpoints públicos.

Swagger UI: `/docs/` — Schema: `/schema/`

## Auth (`/auth/`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register/` | Registro de usuario |
| POST | `/auth/login/` | Login → `access` + `refresh` |
| POST | `/auth/token/refresh/` | Renovar access token |

Registro (`POST /auth/register/`):

```json
{
  "username": "...",
  "email": "a@b.com",
  "password": "...",
  "password_confirm": "...",
  "first_name": "...",
  "last_name": "..."
}
```

El registro crea el usuario **y su tienda automáticamente**. JWT: access 1 día,
refresh 30 días. Nota: las URLs de imágenes (logo, producto) que devuelven los
serializers son de Cloudinary con `f_auto,q_auto`.

## Tenants (`/tenants/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/tenants/tenant/` | Listar/crear tiendas del usuario |
| GET/PATCH/PUT/DELETE | `/tenants/tenant/<id>/` | Detalle de tienda |
| GET | `/tenants/palettes/` | Catálogo de paletas disponibles (requiere sesión) |
| GET/POST | `/tenants/tenants/<id>/members/` | Miembros de la tienda |
| GET/PATCH/PUT/DELETE | `/tenants/tenants/<id>/members/<pk>/` | Detalle de miembro |

### Configuración visual de la tienda

Cada tienda guarda su paleta. Al leer una tienda se devuelve:

```json
"theme": {
  "palette": "blue",
  "primary": "#2563EB",
  "secondary": "#DBEAFE",
  "background": "#F6F7F9",
  "text": "#1F2430"
}
```

Para actualizarla, `PATCH /tenants/tenant/<id>/` acepta la clave de una paleta
predefinida o colores hexadecimales sueltos:

```json
{ "theme_palette": "green" }
```

```json
{ "theme_primary": "#123ABC", "theme_secondary": "#FFFFFF" }
```

Solo pueden modificarla usuarios autenticados con membresía en esa tienda; el
queryset filtra por membresía (un usuario ajeno recibe `404`). Los colores se
validan como hexadecimal `#RGB`/`#RRGGBB`.

## Catálogo (`/catalog/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/catalog/tenants/<id>/categories/` | Categorías |
| GET/PATCH/PUT/DELETE | `/catalog/tenants/<id>/categories/<pk>/` | Detalle |
| GET/POST | `/catalog/tenants/<id>/products/` | Productos |
| GET/PATCH/PUT/DELETE | `/catalog/tenants/<id>/products/<pk>/` | Detalle |

## Storefront público (`/public/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/public/<slug>/` | Tienda pública: logo, whatsapp, categorías, productos activos. Sin JWT. |

## Otros

- `GET /health/` → `{"status": "ok"}` (alias legacy: `/healt/`)
- `/admin/` panel Django
