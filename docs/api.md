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
refresh 30 días. Ante un `401`, el cliente renueva con `/auth/token/refresh/` y
repite la petición (el frontend lo hace solo, así la sesión dura hasta 30 días).
Nota: las URLs de imágenes (logo, producto) que devuelven los serializers son de
Cloudinary con `f_auto,q_auto`.

## Tenants (`/tenants/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/tenants/tenant/` | Listar/crear tiendas del usuario |
| GET/PATCH/PUT/DELETE | `/tenants/tenant/<id>/` | Detalle de tienda |
| GET | `/tenants/palettes/` | Catálogo de paletas disponibles (requiere sesión) |
| GET/POST | `/tenants/tenants/<id>/members/` | Miembros de la tienda |
| GET/PATCH/PUT/DELETE | `/tenants/tenants/<id>/members/<pk>/` | Detalle de miembro |

### Slug de la tienda

El `slug` se deriva del `name`: se genera al crear la tienda y se **regenera al
renombrar**. Se mantiene único con sufijo `-2`, `-3`, … (excluyendo la propia
tienda); si el nombre no cambia, el slug no se toca, y un nombre sin letras usa
el fallback `tienda`.

> ⚠️ Al renombrar cambia el enlace público `/tienda/<slug>`: los links
> compartidos con el slug anterior dejan de funcionar.

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

### Canales de compra

Cada tienda elige por qué canales recibe pedidos con `purchase_channels`, una
lista de claves. La definición vive en `tenants/channels.py` (única fuente):

| Clave | Canal | Dato que usa |
|---|---|---|
| `whatsapp` | WhatsApp | `whatsapp` (número) |
| `instagram` | Instagram | `instagram_url` |
| `facebook` | Facebook | `facebook_url` |
| `tiktok` | TikTok | `tiktok_url` |

`GET` devuelve la lista normalizada (orden canónico, sin duplicados). Para
actualizarla, `PATCH /tenants/tenant/<id>/`:

```json
{ "purchase_channels": ["whatsapp", "instagram"] }
```

Reglas:

- Solo se aceptan claves conocidas; una clave inválida responde `400`.
- **No se puede activar un canal sin un destino válido**: WhatsApp requiere
  dígitos en `whatsapp` y las redes una URL `http(s)` completa. Si falta, la
  respuesta es `400` con `"Para activar Instagram primero configurá el enlace de
  Instagram."`.
- LinkedIn no es un canal de compra (solo aparece como enlace).

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
| GET | `/public/<slug>/` | Tienda pública: logo, whatsapp, canales de compra (efectivos), categorías y productos activos. Sin JWT. |

`purchase_channels` en el storefront son los **canales efectivos**: los activados
que además tienen un destino válido. El frontend los convierte en los botones de
compra ("Comprar por WhatsApp" / "Preguntar por Instagram, Facebook o TikTok").

## Pagos y suscripción (`/payments/`)

Flujo manual: el dueño deposita/transfiere la suscripción a la cuenta de
LibreDrop, sube el comprobante y el superusuario aprueba el pago, lo que
activa/renueva el plan.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/payments/` | autenticado | Subir comprobante (`tenant`, `description`, `image` multipart). Queda `pending`. |
| GET | `/payments/` | superusuario | Listar pagos |
| GET/PATCH/PUT/DELETE | `/payments/<id>/` | superusuario | Detalle y gestión |
| POST | `/payments/<id>/activate/` | superusuario | Aprueba el pago y activa/renueva 1 mes |
| GET | `/payments/billing/` | autenticado | Datos de la cuenta bancaria de LibreDrop |
| PUT/PATCH | `/payments/billing/` | superusuario | Editar la cuenta bancaria |

`status`: `pending` | `approved` | `rejected` (solo lectura en el serializer).

Datos de la cuenta (`billing`): `bank`, `account_type`, `account_number`,
`holder`, `updated_at`. Viven en la base de datos (fila única) para poder
cambiarlos desde el panel sin redeploy.

Cada tienda expone su plan en `subscription`:

```json
"subscription": {
  "status": "active",
  "current_period_end": "2026-11-20T12:00:00Z",
  "grace_days_remaining": 10
}
```

`status` se calcula en vivo: `active` hasta `current_period_end`, `past_due`
durante los 10 días de gracia y `suspended` después. Es `null` si la tienda no
tiene suscripción. El plan se cobra por períodos de 30 días.

## Otros

- `GET /health/` → `{"status": "ok"}` (alias legacy: `/healt/`)
- `GET /version/` → commit desplegado: `{"commit": "...", "short": "abc1234", "branch": "main"}` (desde `RENDER_GIT_COMMIT`/`RENDER_GIT_BRANCH`; útil para verificar deploys)
- `/admin/` panel Django
