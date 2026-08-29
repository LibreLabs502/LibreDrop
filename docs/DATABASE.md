# Base de Datos

Este documento describe el modelo de datos de LibreDrop: las aplicaciones, los esquemas (multi-tenant), cada modelo y el significado de sus campos.

> **Imágenes y Cloudinary:** los campos `StoreProfile.logo` y `Product.image` usan `CloudinaryField`, que sube y almacena los archivos en Cloudinary. Requiere las variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en las variables de entorno (leídas en `settings.py`). Sin credenciales el servidor arranca, pero las subidas de archivos fallan.

## Arquitectura multi-tenant

LibreDrop usa **django-tenants**. Cada tienda es un `Tenant` y sus datos se aíslan en un **esquema de PostgreSQL propio**.

- **Esquema público (`public`)**: datos globales — tenants, dominios y usuarios.
- **Esquema por tienda (uno por cada `Tenant`)**: catálogo, clientes, pedidos y perfil de la tienda.

```
public (shared)
  └── tenants.Tenant, tenants.Domain, accounts.User
  └── django_tenants.middleware analiza el dominio de la petición y activa el esquema correcto

esquema "mitienda" (tenant)
  └── stores.StoreProfile
  └── catalog.Category, catalog.Product
  └── customers.Customer
  └── orders.Order, orders.OrderItem
```

Cuando se crea un `Tenant`, `auto_create_schema` genera su esquema y ejecuta las migraciones de las apps `TENANT_APPS` automáticamente.

### Apps shared vs tenant

| App | Ubicación | Contenido |
| --- | --- | --- |
| `tenants` | shared | `Tenant`, `Domain` |
| `accounts` | shared | `User` |
| `stores` | tenant | `StoreProfile` |
| `catalog` | tenant | `Category`, `Product` |
| `customers` | tenant | `Customer` |
| `orders` | tenant | `Order`, `OrderItem` |

> El seguimiento de pagos se agregará en una futura versión; en el MVP v0.1 la venta se cierra directamente por WhatsApp.

---

## Esquema público (shared)

### `tenants.Tenant`

Registro de la tienda en el esquema público. Cada `Tenant` genera y posee un esquema de PostgreSQL propio.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `schema_name` | `CharField(63)`, único | Subdominio que identifica a la tienda, p. ej. `mitienda` para `mitienda.libredrop.app`. |
| `name` | `CharField(100)` | Nombre comercial del tenant. |
| `created_on` | `DateField`, auto | Fecha en que se registró la tienda. |

- `auto_create_schema = True`: al guardar el registro se crea el esquema y se migran las apps tenant.

### `tenants.Domain`

Dominio o subdominio asociado a un tenant, proveniente del mixin `DomainMixin`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `domain` | `CharField(253)`, único | Dominio completo, p. ej. `mitienda.libredrop.app`. |
| `tenant` | `FK → tenants.Tenant` | Tienda a la que pertenece el dominio. |
| `is_primary` | `BooleanField` | Indica si es el dominio principal de la tienda. |

### `accounts.User`

Usuario global (dueño de una o varias tiendas). Extiende `AbstractUser` y el login se hace con el correo.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `email` | `EmailField`, único | Identificador de acceso (`USERNAME_FIELD`). |
| `first_name` | `CharField(150)` | Nombre(s) del usuario. |
| `last_name` | `CharField(150)` | Apellido(s) del usuario. |
| `password` | (heredado) | Contraseña con hash de Django. |
| `is_staff` / `is_superuser` | (heredado) | Permisos de admin. |
| `username` | — | Eliminado; se usa `email` como identificador. |

> **Nota:** `AUTH_USER_MODEL = 'accounts.User'`. La creación de usuarios usa `UserManager` + tokens JWT (djangorestframework-simplejwt).

---

## Esquema tenant (por tienda)

### `stores.StoreProfile`

Configuración y datos públicos de la tienda dentro de su propio esquema.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `tenant` | `OneToOne → tenants.Tenant` | Tienda a la que pertenece el perfil. |
| `trade_name` | `CharField(100)` | Nombre mostrado públicamente. |
| `description` | `TextField`, opcional | Descripción corta para la landing. |
| `logo` | `CloudinaryField`, opcional | Logo de la tienda. Se sube y almacena en Cloudinary. |
| `whatsapp_number` | `CharField(20)` | Número en E.164 (ej. `+50212345678`). **Destino de los pedidos**: el botón "Comprar" abre `wa.me` con este número. |
| `currency` | `CharField(3)`, default `GTQ` | Código ISO 4217 de la moneda (GTQ, USD, MXN…). |
| `primary_color` | `CharField(7)`, opcional | Color de marca en HEX (ej. `#FF5722`). |
| `is_active` | `BooleanField`, default `True` | Si está desmarcada, la tienda no se muestra. |
| `created_at` | `DateTimeField`, auto | Fecha de creación del perfil. |

### `catalog.Category`

Agrupación de productos.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `name` | `CharField(100)` | Nombre de la categoría (ej. "Ropa"). |
| `slug` | `SlugField(120)`, único | Identificador amigable de URL (ej. `ropa`). |
| `is_active` | `BooleanField`, default `True` | Si está desmarcada, la categoría se oculta. |

### `catalog.Product`

Producto publicado en la tienda.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `category` | `FK → Category` (`PROTECT`) | Categoría del producto. No se puede borrar si tiene productos. |
| `name` | `CharField(200)` | Nombre del producto. |
| `slug` | `SlugField(220)`, único | Identificador amigable de URL. |
| `description` | `TextField`, opcional | Detalle del producto. |
| `price` | `DecimalField(10, 2)` | Precio de venta en la moneda de la tienda. |
| `compare_at_price` | `DecimalField(10, 2)`, nulo | Precio anterior (tachado) con fines promocionales. |
| `image` | `CloudinaryField`, opcional | Imagen principal del producto. Se sube y almacena en Cloudinary. |
| `quantity` | `PositiveIntegerField`, default `0` | Existencias simples. Sin control de inventario. |
| `is_active` | `BooleanField`, default `True` | **Soft-delete**: desmarcado oculta el producto pero conserva su historial en pedidos. |
| `is_featured` | `BooleanField`, default `False` | Lo muestra en la sección destacada. |
| `created_at` / `updated_at` | `DateTimeField`, auto | Fechas de creación y última modificación. |

### `customers.Customer`

Comprador que contacta a la tienda por WhatsApp.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `name` | `CharField(150)` | Nombre del cliente. |
| `phone` | `CharField(20)` | Teléfono en E.164 (ej. `+50212345678`). Contacto de WhatsApp. |
| `email` | `EmailField`, opcional | Correo del cliente. |
| `address` | `TextField`, opcional | Dirección de entrega. |
| `notes` | `TextField`, opcional | Notas internas del vendedor. |
| `created_at` | `DateTimeField`, auto | Fecha de registro. |

### `orders.Order`

Pedido recibido por la tienda vía WhatsApp.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `customer` | `FK → Customer` (`PROTECT`) | Cliente que realizó el pedido. |
| `status` | `CharField(20)`, choices, default `pending` | Etapa del ciclo de vida (ver abajo). |
| `subtotal` | `DecimalField(10, 2)` | Suma de productos sin envío. |
| `shipping` | `DecimalField(10, 2)`, default `0` | Costo de envío. |
| `total` | `DecimalField(10, 2)` | Total del pedido (`subtotal + shipping`). |
| `shipping_address` | `TextField`, opcional | Dirección de entrega. |
| `notes` | `TextField`, opcional | Notas del cliente o vendedor. |
| `created_at` | `DateTimeField`, auto | Fecha del pedido. |

**Estados de `status`:**

| Valor | Etiqueta | Significado |
| --- | --- | --- |
| `pending` | Pendiente | Se registró el pedido. |
| `sent_wa` | Enviado por WhatsApp | El mensaje con el pedido se envió al `whatsapp_number` de la tienda. |
| `confirmed` | Confirmado | El cliente confirmó la compra. |
| `fulfilled` | Entregado | El pedido se entregó. |
| `cancelled` | Cancelado | El pedido no procedió. |

El flujo arranca en `pending` y avanza por cada etapa; `cancelled` puede ocurrir desde cualquier estado.

### `orders.OrderItem`

Línea de un pedido. **Guarda una fotografía (snapshot) del producto** al momento de la compra.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `order` | `FK → Order` (`CASCADE`) | Pedido al que pertenece. |
| `product` | `FK → Product` (`SET_NULL`), nulo | Producto referenciado. Queda `NULL` si el producto se elimina. |
| `product_name` | `CharField(200)` | **Snapshot del nombre**. No cambia si el producto se modifica. |
| `quantity` | `PositiveIntegerField`, default `1` | Unidades solicitadas. |
| `unit_price` | `DecimalField(10, 2)` | **Snapshot del precio** unitario al momento de la compra. |
| `total` | *property* | Calculado: `quantity × unit_price`. |

> **Por qué los snapshots:** si un producto se renombra, cambia de precio o se elimina, el historial del pedido (qué se vendió y a cuánto) se conserva intacto.

---

## Relaciones principales

```
Tenant 1──1 StoreProfile
Tenant 1──* Domain

Category 1──* Product
Product 1──* OrderItem
Customer 1──* Order
Order 1──* OrderItem
```

## Ciclo de vida de un pedido (WhatsApp)

1. Un visitante arma su lista de productos en la tienda.
2. El botón de compra abre WhatsApp (`wa.me/<whatsapp_number>` de `StoreProfile`) con el detalle y total del pedido.
3. El mensaje se envía al vendedor → `sent_wa`.
4. El vendedor y el cliente confirman la compra → `confirmed`; la forma de pago (contra entrega, transferencia, etc.) se acuerda directamente en WhatsApp.
5. Al entregar → `fulfilled`.
6. Si no procede → `cancelled`.

> **Nota:** en el MVP v0.1 no existe registro de pagos; el cobro se gestiona por fuera de la plataforma. Un modelo `Payment` puede agregarse en el futuro.