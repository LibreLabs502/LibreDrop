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

En el frontend v1.3, `/admin/` muestra una bienvenida con las opciones **Iniciar
sesión** y **Crear tienda**. El alta está dividida en tres pasos (nombre,
apellido y correo; nombre de usuario; contraseña y confirmación), pero envía el
mismo payload a `POST /auth/register/`; el wizard no requiere endpoints nuevos.
Al completarse, el frontend inicia sesión automáticamente y el registro continúa
en el bloqueo de activación/pago porque el API crea la tienda sin una
suscripción activa.

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

### Texto de los botones de compra

- `Tenant.purchase_button_text` (`CharField(max_length=40,
  default="Comprar por")`) permite personalizar el texto que precede al nombre
  del canal en los botones de la tienda (por ejemplo, **“Pedir por WhatsApp”**).
- Se expone como `purchase_button_text` en el serializer del panel y en el
  storefront público. Si viene vacío o no existe, el frontend usa siempre
  **“Comprar por”** como respaldo.
- El mismo texto se aplica a todos los canales activos.
- `Tenant.sale_text` y `Tenant.featured_products_text` personalizan los títulos
  de las secciones de ofertas y productos destacados. Ambos se editan desde el
  panel de Tiendas, admiten hasta 40 caracteres y el storefront los expone.
- `PATCH /tenants/tenant/<id>/`:

```json
{
  "purchase_button_text": "Pedir por",
  "sale_text": "Ofertas de temporada",
  "featured_products_text": "Favoritos de la tienda"
}
```

## Catálogo (`/catalog/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/catalog/tenants/<id>/categories/` | Categorías normales (`name`) |
| GET/PATCH/PUT/DELETE | `/catalog/tenants/<id>/categories/<pk>/` | Detalle |
| GET/POST | `/catalog/tenants/<id>/seasonal-categories/` | Categorías de temporada (`name`) |
| GET/PATCH/PUT/DELETE | `/catalog/tenants/<id>/seasonal-categories/<pk>/` | Detalle |
| GET/POST | `/catalog/tenants/<id>/products/` | Productos (`featured` marca productos destacados) |
| GET/PATCH/PUT/DELETE | `/catalog/tenants/<id>/products/<pk>/` | Detalle |
| POST | `/catalog/tenants/<id>/products/reorder-featured/` | Guardar el orden de los productos destacados |

Un producto expone: `id`, `category` (puede ser `null`), `seasonal_category`
(puede ser `null`), `name`, `description`, `brand`, `price` (puede ser `null`),
`discount_percent` (entero opcional de 1 a 99), `discounted_price` (calculado,
de solo lectura; es `null` si no hay `price` o descuento), `offer_ends_at`
(fecha/hora ISO 8601 opcional), `featured` (booleano), `featured_order`
(posición opcional), `photo_order` (lista de claves de foto), `image` e
`image2`…`image5` (hasta cinco fotos), `is_active`, `created_at` y `updated_at`.

`discount_percent` es el único dato de oferta. Si hay `price`, el precio
rebajado se calcula como `price * (100 - discount_percent) / 100` y se redondea
a dos decimales. Por ejemplo, precio `10.00` con descuento `20` produce
`discounted_price: "8.00"`. Sin precio normal, se guarda y muestra solo el
porcentaje; `discounted_price` queda `null`. `offer_ends_at` solo se acepta si
hay un porcentaje. Al vencer, la oferta deja de contar en el storefront y el
producto vuelve a mostrar su precio normal.

Las fotos del panel se envían como `multipart/form-data` con las claves `image`,
`image2`, `image3`, `image4` e `image5`. Las claves sin archivo se omiten y
conservan la foto anterior. `photo_order` acepta claves como `image3`, `image`,
`image2`; en una petición multipart se envía como texto JSON. Las claves
omitidas se agregan al final en su orden natural. `discount_percent` y
`offer_ends_at` se pueden dejar vacíos para quitar esos datos; los valores
válidos del porcentaje son enteros entre 1 y 99. `sales_price` ya no es un
campo válido de entrada.

```json
{
  "price": "100.00",
  "discount_percent": 20,
  "offer_ends_at": "2026-11-30T23:59:00Z",
  "featured": true,
  "photo_order": ["image3", "image", "image2"]
}
```

Para guardar manualmente el orden de destacados, enviar los IDs en el orden
deseado. Los productos deben pertenecer a la tienda:

```json
{ "ids": [3, 1, 2] }
```

## Storefront público (`/public/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/public/<slug>/` | Tienda pública: logo, whatsapp, canales de compra (efectivos), categorías, categorías de temporada y productos activos. Sin JWT. |

`purchase_channels` en el storefront son los **canales efectivos**: los activados
que además tienen un destino válido. El frontend los convierte en los botones de
compra. El texto que precede al canal viene de `purchase_button_text` (por
defecto "Comprar por"), así que puede verse "Comprar por WhatsApp" o
"Pedir por Instagram".

`sale_text` y `featured_products_text` definen los encabezados de las secciones
de ofertas y productos destacados. `seasonal_categories` lista las categorías de
temporada de la tienda. Los productos con `featured: true` aparecen en la
colección de destacados y los que tienen `seasonal_category` en la de temporada.
El frontend v1.3 presenta una sola colección principal en este orden de
prioridad: **Temporada**, **Ofertas**, **Destacados**. La colección principal
usa el carrusel automático con su producto, imagen, precio y canales de compra.
Las colecciones restantes aparecen en filas horizontales con flechas y el botón
**Ver todas**. Si no hay productos con foto en ninguna colección, se muestra la
bienvenida de la tienda sin carrusel. Debajo aparecen los filtros de categoría y
la lista de productos.

La navegación principal de la tienda incluye enlaces a categorías, búsqueda y
un menú hamburguesa en teléfonos. Al buscar, la portada de bienvenida y las
filas de colecciones se ocultan; **Descubre la tienda** muestra el término y los
productos que coinciden. El cuadro de búsqueda flota bajo el navbar, que queda
visible con el color de la paleta de la tienda. El cuadro se cierra al tocar
fuera y no mueve la posición de scroll.

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

En el frontend, al enviar correctamente el comprobante se abre WhatsApp con un
mensaje preparado para pedir la activación. El texto queda listo para que el
usuario lo envíe. Mientras el pago está pendiente, **“¿Ya me activaron?
Comprobar”** vuelve a cargar las tiendas; si encuentra una suscripción activa,
el frontend muestra el saludo de bienvenida antes de entrar al panel.

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
