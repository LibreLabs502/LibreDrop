# Arquitectura

## Multitenancy

Multitenancy **lineal por `tenant_id`**: mismas tablas para todos, cada registro
lleva su `tenant_id`. No se usa `django-tenants` ni schemas por tienda.
Los querysets filtran por membresía del usuario autenticado.

## Backend

Django 6.1 + DRF. Apps:

- `accounts` — modelo `User` propio y autenticación JWT.
- `tenants` — tiendas y miembros (roles) + paletas de color y canales de compra por tienda.
- `catalog` — categorías y productos por tienda.
- `customers` — datos de clientes asociados a una tienda.
- `orders` — pedidos, líneas de producto y precios históricos; su endpoint
  público crea pedidos sin cuenta y valida tienda, canal y productos activos.
- `storefront` — API pública de la tienda (sin auth).
- `payments` — pagos manuales (comprobantes) y datos de la cuenta bancaria de LibreDrop.

Las paletas viven en `tenants/theme.py` (única definición) y cada `Tenant`
guarda sus colores en `theme_*`. El panel los edita vía `PATCH /tenants/tenant/`
y la tienda pública los recibe en el campo `theme` para aplicarlos como
variables CSS aisladas por tienda.

Los **canales de compra** viven en `tenants/channels.py` (única definición) y se
guardan en `Tenant.purchase_channels` (lista de claves: WhatsApp, Instagram,
Facebook y TikTok; LinkedIn queda fuera por ser red de contacto). Un canal solo
se activa si su destino es válido, y el storefront público expone únicamente los
canales **efectivos** (activados y con destino válido), que el frontend
transforma en botones. El panel reutiliza las mismas etiquetas desde
`frontend/src/channels.js`. El texto que precede al canal es fijo:
**“Comprar por”**.

El cobro es **manual**: el dueño sube un comprobante (`Payment`, estado
`pending`) y el superusuario lo aprueba (`POST /payments/<id>/activate/`), lo que
activa/renueva la suscripción de la tienda por 30 días. `Subscription` (app
`tenants`) se calcula en vivo: `active`, `past_due` (10 días de gracia) y
`suspended`. Los datos de la cuenta bancaria (`BillingInfo`) viven en la base de
datos (fila única) y se editan desde el panel del superusuario.

Cada usuario guarda `agreement_version` y `agreement_accepted_at`. El endpoint
`/auth/me/` expone la versión vigente y `POST /auth/agreement/accept/` registra
la aceptación autenticada. El panel la exige a quienes administran una tienda,
tanto a las cuentas existentes como a las nuevas antes del primer pago. El
texto se mantiene en `AgreementGate.jsx` y el panel ofrece una ventana para
volver a consultarlo. La versión v4 vuelve a exigir aceptación a las cuentas
con tiendas existentes al entrar al panel, incluso si mantienen una sesión
activa. La versión v3 explica la licencia GNU AGPL-3.0, que las
mejoras aceptadas se integran al producto común para todas las tiendas y que la
suscripción cubre alojamiento, actualizaciones y soporte de 6:00 a. m. a 10:00
p. m. (hora de Guatemala), no una licencia del código. También describe el uso
de datos de pedidos y los límites de `robots.txt`: solicita a todos los
rastreadores que no recorran ninguna ruta, pero no es un control de acceso ni
permite controlar bots que ignoran la directiva.

Las **ofertas** se guardan únicamente en `Product.discount_percent` (entero de
1 a 99). Si hay `price`, `Product.discounted_price` calcula el precio rebajado
redondeado a dos decimales; sin precio normal, queda `null` y la tienda muestra
solo el porcentaje. `offer_ends_at` es opcional y exige un porcentaje. La tienda
muestra una cuenta regresiva y, al llegar la fecha, deja de contar el producto
como oferta y vuelve a mostrar su precio normal. La migración 0016 deriva el
porcentaje del precio de oferta anterior cuando puede y elimina
`Product.sales_price`.

Las **categorías de temporada** (`SeasonalCategory`) agrupan productos para la
colección “Productos de temporada”. Al elegir el filtro **Temporada**, el
frontend presenta las subcategorías debajo del buscador y permite filtrar por
una o ver todas. Los **productos destacados** usan `Product.featured`; el orden
opcional se guarda en `featured_order` y se usa en la tienda pública. El endpoint
`POST /catalog/tenants/<id>/products/reorder-featured/` guarda una lista ordenada
de IDs pertenecientes a la tienda.

La tienda pública prioriza un solo carrusel principal: primero **Temporada**,
después **Ofertas** y finalmente **Destacados**. La imagen cambia
automáticamente y el contenido permite abrir el detalle o usar los canales de
compra configurados. Las otras colecciones aparecen como filas horizontales
desplazables con flechas y una acción para ver la colección completa. Estas
filas pueden mostrar cualquier cantidad de productos con foto; si una colección
no tiene fotos, no se muestra su fila.

Cada producto puede tener hasta **5 fotos** en `image` + `image2`…`image5`. La
lista `photo_order` define el orden de entrega y cuál queda como portada; las
claves ausentes se agregan en orden natural. El resto se muestra en la ventana
que abre el enlace **“Ver detalles…”**, ubicado debajo de la descripción y antes
de los botones de compra.

Imágenes (logo, producto) se suben a Cloudinary y los serializers devuelven la
URL completa con entrega optimizada `f_auto,q_auto` (WebP/AVIF + calidad
automática) vía el helper `backend/backend/images.py::optimized()`.
Config vía variables de entorno `CLOUDINARY_*`.

## Frontend

React SPA (Vite). Páginas:

- `/` → redirige a `/admin` (login/registro si no hay sesión).
- `/admin` — panel: Tiendas (con **canales de compra**), Catálogo, Apariencia,
  Pedidos y Pagos (suscripción; si el plan no está activo el panel muestra el
  bloqueo de activación). Al entrar se muestra una ventana de **Novedades** con la última
  actualización; al abrirla desde el botón **Novedades** o **Ver Novedades** se
  ve el historial completo separado por número y fecha. Se controla desde
  `frontend/src/updates.js` y se recuerda por usuario con `localStorage`.
- `/admin` sin sesión — bienvenida con opciones **Iniciar sesión** y **Crear
  tienda**. El registro se presenta en tres pasos (nombre, apellido y correo;
  usuario; contraseña y confirmación), pero conserva el endpoint de registro
  actual, que crea la cuenta y la tienda automáticamente. El inicio de sesión y
  el registro muestran un saludo animado antes del panel.
- `/admin` sin plan activo — formulario de pago. Después de subir el comprobante,
  el navegador abre WhatsApp con un mensaje de activación preparado. El botón
  **“¿Ya me activaron? Comprobar”** recarga las tiendas; si encuentra la
  suscripción activa, muestra el saludo de bienvenida antes de entrar al panel.
- Antes del panel o del pago, según el estado de la cuenta, aparece el acuerdo
  de uso y tratamiento de datos; la aceptación queda guardada por versión y
  fecha. Al enviar un comprobante, el logo de LibreDrop hace un zoom al centro
  y se reduce antes de continuar el envío.
- `/tienda/<slug>` — tienda pública: portada de ancho completo con logo,
  bienvenida y colección principal; navbar de tienda con búsqueda, categorías y
  menú hamburguesa en teléfono; descripción de tienda centrada; colección de
  temporada/ofertas/destacados priorizada y filas para las colecciones
  restantes. Al buscar, la bienvenida y las colecciones se ocultan, el navbar
  permanece visible y **Descubre la tienda** muestra los resultados sin mover
  la posición de scroll. La búsqueda se cierra al tocar fuera. También hay
  filtros de categorías sobre los productos, modal de detalle y
  **botones de compra por canal**, con el texto fijo "Comprar por". En las
  redes sociales se abre una ventana con
  el pedido copiable y los pasos para pegarlo en el chat; WhatsApp abre el chat
  directo con el mensaje. Los productos con oferta muestran el precio rebajado,
  el anterior tachado, el porcentaje, la cuenta regresiva si hay vencimiento y
  el filtro **“Ofertas”**. Al elegir **Temporada**, aparecen subcategorías debajo
  del buscador. El carrito se guarda localmente por tienda; al completar los
  datos y elegir un canal, el backend registra el pedido con copias históricas
  de artículos y precios. La confirmación muestra el mensaje con nombre,
  número de pedido y productos; para redes sociales se puede copiar antes de
  continuar al perfil.
- `/admin/pedidos` — pedidos de la tienda seleccionada. La lista muestra número,
  fecha y estado; al desplegar una fila se ven los datos del cliente, artículos,
  total y notas, y se puede actualizar el estado.

La tienda se adapta a la paleta, tiene transiciones y responde a móviles.

Estado de sesión en `AuthContext` + tokens en `localStorage`. El access token
(1 día) se renueva automáticamente con el refresh token (30 días) ante un `401`,
así la sesión se mantiene sin volver a loguearse.

## Despliegue

- **Backend**: imagen Docker (Dockerfile en la raíz) en Render; Gunicorn +
  WhiteNoise (estáticos). Sin base de datos en el contenedor.
- **DB**: Neon por `DATABASE_URL` (Postgres externo).
- **Frontend**: build estático en Vercel; `VITE_API_URL` apunta al backend.
- **Migraciones**: automáticas en cada deploy (`scripts/release.sh`, llamado por
  `entrypoint.sh` al arrancar y por el pre-deploy de Render).

Detalle en [despliegue.md](despliegue.md).
