# Versiones

## v1.6 — Dos nuevas paletas para las tiendas

- Se agregan las paletas **Turquesa** y **Negro y amarillo** al selector de
  apariencia. La primera usa fondos claros y acentos turquesa; la segunda,
  fondos oscuros con acentos amarillos.
- El catálogo del backend las expone junto con las paletas existentes y el
  panel las muestra automáticamente.

## v1.5 — Acuerdo de uso y protección de datos

- Al iniciar sesión, las cuentas que administran una tienda revisan y aceptan
  el acuerdo antes de entrar al panel. Las cuentas nuevas lo aceptan después
  del registro y antes de enviar el primer pago de suscripción.
- La aceptación se guarda en la cuenta con la versión del acuerdo y la fecha;
  si se publica una versión nueva, vuelve a solicitarse.
- El acuerdo explica el uso de datos de cuenta, tienda, clientes, pedidos y
  comprobantes; los permisos de acceso, proveedores tecnológicos y canales
  externos, y las responsabilidades de cada tienda.
- La versión v3 del acuerdo detalla que la suscripción incluye alojamiento,
  actualizaciones y soporte por redes sociales de 6:00 a. m. a 10:00 p. m.
  (hora de Guatemala); el código se ofrece bajo GNU AGPL-3.0 y la suscripción
  cubre el alojamiento, no una licencia del código.
- El acuerdo explica que las mejoras aceptadas para el servicio oficial se
  integran al producto común para todas las tiendas y que no se garantizan
  desarrollos exclusivos ni la aprobación de cada solicitud.
- El acuerdo aclara que LibreDrop no usa datos personales de pedidos para
  entrenar modelos propios y que `robots.txt` solicita no rastrear el sitio,
  pero no puede impedir que bots externos ignoren esa instrucción o reutilicen
  contenido público.
- El mensaje generado para los pedidos muestra que el pedido está en el panel
  y agrega el enlace de LibreDrop. El cliente puede volver al selector y
  cambiar de canal sin crear un pedido duplicado.
- Se ajustaron las ventanas del checkout y confirmación de pedido para pantallas
  pequeñas.
- El panel permite volver a consultar el acuerdo desde **Ver acuerdo y
  privacidad**.
- La versión v4 vuelve a pedir aceptación a las cuentas que ya tienen tienda
  cuando entran al panel; la sesión y el token permanecen activos.
- Al enviar un comprobante de suscripción aparece una transición a pantalla
  completa: el logo de LibreDrop crece al centro y luego se reduce antes de
  continuar con el envío.
- Los botones de compra usan el texto **“Comprar por”** en todas las tiendas;
  se retiró la personalización por tienda para mantener modelo y serializers
  alineados (`tenants/0015`).

## v1.4 — Pedidos desde la tienda

- La tienda pública incorpora un carrito local por tienda; no crea un pedido en
  el backend hasta que el cliente completa sus datos y elige un canal.
- El checkout pide nombre, teléfono y dirección, y permite agregar correo y
  notas opcionales. El cliente puede revisar productos, cantidades y total antes
  de continuar.
- Al confirmar, el backend valida que la tienda, el canal y los productos estén
  disponibles, registra el pedido y guarda una copia de los nombres, precios y
  descuentos. Los datos del cliente se reutilizan dentro de la tienda según su
  número de teléfono.
- Después de registrar el pedido, el cliente ve **“¡Listo, tu pedido fue
  realizado!”** y puede continuar al canal elegido. El mensaje incluye su
  nombre, el número de pedido, productos y cantidades; en WhatsApp queda
  preparado y en Instagram, Facebook o TikTok se puede copiar para enviarlo.
- El panel agrega **Pedidos**, con filtro por estado. La lista muestra primero
  número, fecha y estado; una flecha despliega los datos del cliente, artículos,
  total y notas. El estado se actualiza desde ese detalle.
- API: `POST /orders/public/<slug>/` para crear pedidos y endpoints bajo
  `/orders/tenants/<tenant_id>/` para consultarlos y actualizar su estado.
- La app `orders` incluye su migración inicial y limita la creación pública a
  30 intentos por hora.

## v1.3 — Renovación visual de la tienda pública

- La tienda compartida ahora abre con una portada a ancho completo que une el
  logo y la bienvenida con la colección principal.
- El carrusel principal prioriza **Temporada**, luego **Ofertas** y después
  **Destacados**. Si no hay una colección disponible, la portada muestra el
  logo y el nombre de la tienda en grande.
- Las demás colecciones aparecen en filas desplazables, con flechas y el enlace
  **Ver todas**.
- La navegación principal incluye categorías, búsqueda y un menú hamburguesa
  en teléfonos. La barra de categorías y filtros de productos permanece sobre
  el listado.
- Al abrir la búsqueda, el campo aparece flotando bajo el navbar sin mover la
  página ni cambiar el punto de desplazamiento actual.
- La portada, las tarjetas y los controles usan la paleta de la tienda,
  transiciones de entrada y una animación renovada entre productos.
- Se conservan los canales de compra que configura cada tienda y no se agrega
  carrito.
- `/admin/` presenta una bienvenida con accesos para iniciar sesión o crear una
  cuenta. El registro se completa en tres pasos: nombre, apellido y correo;
  nombre de usuario; contraseña y confirmación. El API sigue creando la tienda
  automáticamente al terminar el registro.
- Al iniciar sesión aparece un saludo antes del panel. Tras enviar el
  comprobante de pago, se abre WhatsApp con el mensaje de activación preparado;
  al usar **“¿Ya me activaron? Comprobar”**, si el plan está activo, aparece el
  saludo antes de volver al panel.

## v1.2 — Descuentos calculados por porcentaje

- El formulario de productos ya no pide un precio de oferta. Ingresá el precio
  normal y un descuento entero de 1 a 99; el precio rebajado se calcula solo.
- Si el producto no tiene precio normal, la tienda muestra únicamente el
  porcentaje y no inventa un monto.
- El API devuelve `discounted_price` como campo calculado y ya no expone
  `sales_price` como dato de producto.
- La migración `catalog/0016_remove_product_sales_price.py` conserva el
  porcentaje de las ofertas existentes antes de eliminar la columna. Cuando se
  puede, lo deriva de `price` y el antiguo precio de oferta; si una oferta sin
  precio normal tampoco tenía porcentaje, conserva su visibilidad con el mínimo
  válido de 1% porque no existe una base para recuperar el porcentaje real.

## v1.1 — Colecciones de temporada, ofertas y destacados

- Panel → Catálogo: marcá productos para destacarlos y asignales una categoría
  de temporada —por ejemplo Navidad o Día de la Madre—.
- Panel → Catálogo: las categorías de temporada se crean y editan como las
  categorías normales.
- La tienda pública muestra hasta tres carruseles de fotos, en este orden:
  **Productos de temporada**, **Ofertas** y **Productos destacados**. Cada uno
  aparece solo si su colección tiene al menos tres productos con foto. Con uno
  o dos, la colección sigue disponible desde sus filtros, sin mostrar carrusel.
- Los carruseles avanzan solos y muestran tres fotos por tanda. Si la última
  tanda queda incompleta, se repiten fotos de la colección hasta completar las
  tres posiciones.
- Debajo de cada carrusel hay un botón (**Ver ofertas**, **Ver productos de
  temporada**, **Ver productos destacados**) que activa el filtro de esa
  colección y oculta el carrusel.
- La barra de categorías suma los filtros **Ofertas**, **Temporada** y
  **Destacados**, con la cantidad de productos de cada colección.
- Al elegir **Temporada**, aparecen debajo del buscador las subcategorías de
  temporada disponibles, con su cantidad de productos. Se puede elegir una o
  volver a **Todas**.
- La migración v1.1 restauró temporalmente `Product.sales_price`; v1.2 lo elimina
  de nuevo y usa `discount_percent` como única entrada de oferta.
- `Product.offer_ends_at` permite programar el fin de una oferta. La tienda
  muestra una cuenta regresiva, y al vencer deja de mostrarla en los carruseles
  y el filtro de ofertas; el producto sigue en el catálogo con su precio normal.
- La migración `catalog/0015_product_featured_order_product_offer_ends_at_and_more.py`
  agrega la fecha de vencimiento, el orden de fotos y la posición de destacados.
- Los serializers del catálogo y del storefront exponen el precio calculado,
  `Product.featured`, `Product.seasonal_category`,
  `Tenant.featured_products_text` y `Tenant.seasonal_categories`.
- Las secciones usan la paleta de la tienda, se adaptan a móviles y respetan la
  preferencia de reducir movimiento.

## v1 — Catálogo más rápido y ofertas renovadas

- Se conserva la carga de **hasta cinco fotos por producto** y la vista
  “Ver detalles” descrita abajo.
- Las ofertas ahora se registran únicamente con `discount_percent` (entero de
  1 a 99). Si existe `price`, el precio rebajado se calcula automáticamente;
  si no existe, se muestra solo el porcentaje. La migración 0010 convierte las
  ofertas guardadas antes de eliminar `sales_price`. Para registros antiguos
  sin precio normal ni porcentaje, conserva la oferta como 1%, ya que no había
  datos para recuperar el porcentaje original.
- En la tienda, los productos en oferta muestran el precio normal y el precio
  calculado con descuento. Un carrusel debajo de la descripción muestra una
  foto a la vez para dos ofertas y hasta tres fotos para tres o más; “Ver
  ofertas” oculta el carrusel y filtra todos los productos rebajados. El título
  usa `Tenant.sale_text`, editable desde Tiendas, y las fotos avanzan
  automáticamente.
- Panel → Catálogo: buscá productos por nombre, marca o descripción.

- `Product` suma `image2`, `image3`, `image4` e `image5` (opcionales); junto a
  `image` permiten hasta **5 fotos por producto**. Migración
  `catalog/0008_product_image2_product_image3_product_image4_and_more.py`.
- Los serializers del panel y del storefront exponen las cinco fotos con la
  entrega optimizada de Cloudinary.
- Panel → Catálogo: cada producto tiene hasta cinco espacios de foto. La
  **primera es la portada**; al editar se ve la foto actual y se puede
  reemplazar cualquier espacio.
- Tienda pública: debajo de la descripción y **antes de los botones de compra**
  aparece **“Ver detalles…”**. Abre una ventana con **todas las fotos subidas**
  (miniatura principal + selector), el precio y los botones de compra.
- La tarjeta sigue usando la primera foto como portada.
- Pruebas: `catalog/tests.py`, `storefront/tests.py` y
  `frontend/src/pricing.test.js` / `updates.test.js`.

## v0.10 — Ofertas y Novedades con historial

- La oferta por precio fijo (`Product.sales_price`) descrita en esta versión
  fue reemplazada en v1 por el porcentaje `discount_percent` y restaurada en
  v1.1 como base de las ofertas.

### Historial de Novedades

- Al entrar al panel con una actualización sin ver, la ventana muestra **solo la
  última versión**, igual que antes.
- Al abrirla desde **“Novedades”** (barra lateral) o **“Ver Novedades”**
  (Tiendas), se muestra el **historial completo** (`v0.10`, `v0.9`, `v0.8`, …)
  separado por número y fecha.
- La fuente sigue siendo `frontend/src/updates.js` (`UPDATES`, con la más
  reciente primero); el seguimiento de “visto” continúa por usuario y por
  `LATEST_UPDATE.version`.
- Pruebas: `catalog/tests.py`, `storefront/tests.py` y
  `frontend/src/pricing.test.js` / `updates.test.js`.

## v0.9 — Texto personalizado de los botones de compra

- `Tenant.purchase_button_text` (`CharField(max_length=40,
  default="Comprar por")`) permite que cada tienda escriba su propio texto para
  los botones de compra, por ejemplo **“Pedir por WhatsApp”**.
- El panel lo edita en **“Texto de los botones de compra”**, con contador de
  caracteres (máximo 40) y vista previa del botón.
- El mismo texto se usa en **todos** los canales activos (WhatsApp, Instagram,
  Facebook y TikTok).
- Si el campo está vacío, el frontend usa **“Comprar por”** como respaldo. Al
  guardar un texto vacío se restablece el valor predeterminado.
- El backend lo expone en el serializer del panel (`TenantSerializer`) y en el
  storefront público (`PublicTenantSerializer`); migración
  `tenants/0012_tenant_purchase_button_text.py`.
- La pantalla de **Tiendas** incluye un botón **“Ver Novedades”** y la barra
  lateral conserva **“Novedades”**. Mientras haya una actualización sin ver,
  ambos muestran la etiqueta **“Nuevo”**; al cerrar la ventana desaparece.

## v0.8 — Novedades al entrar al panel

- Al entrar al panel, cada usuario ve una ventana **“Novedades en tu panel”** con
  el resumen de la última actualización.
- Las novedades se definen en `frontend/src/updates.js` (`UPDATES`, con la más
  reciente primera). Para publicar una actualización nueva, agregá una entrada
  con una `version` única y actualizá `VERSIONS.md`.
- La ventana se muestra una sola vez por usuario y versión. Lo visto se guarda
  en `localStorage` con la clave `libredrop_updates_seen:<usuario>`.
- El panel incluye un botón **“Novedades”** en la barra lateral para volver a
  abrir el resumen.
- La ventana incluye un botón **“Más información en GitHub”** que abre
  `VERSIONS.md` en el repositorio.
- Se puede cerrar con el botón, tocando fuera de la ventana o con `Escape`.

## v0.7 — Marcas, precios opcionales y pedidos por redes sociales

### Marca de producto

- `Product.brand` (`CharField`, opcional) guarda la marca; migración
  `catalog/0006_product_brand.py`.
- Los serializers del panel (`ProductSerializer`) y de la tienda pública
  (`PublicProductSerializer`) exponen `brand`.
- El panel permite crear y editar la marca; la tienda pública la muestra sobre
  el nombre del producto y el buscador también filtra por marca.

### Precio opcional

- `Product.price` ahora admite `null`/vacío (migraciones `catalog/0004` y
  `0005`). Un producto sin precio ya no muestra **Q 0.00** en el frontend.
- El formulario de producto indica que el precio es opcional y permite dejarlo
  vacío tanto al crear como al editar.

### Edición completa de productos

- Al editar un producto desde el panel se pueden cambiar **todos** los campos:
  nombre, marca, precio, categoría, descripción, imagen y estado activo.

### Pedidos por Instagram, Facebook y TikTok

- WhatsApp mantiene el enlace directo `wa.me` con el mensaje ya escrito.
- En Instagram, Facebook y TikTok el botón **“Preguntar por…”** abre una ventana
  de pedido con el mismo mensaje de WhatsApp.
- El mensaje se intenta copiar automáticamente al portapapeles (con respaldo
  para navegadores sin la API moderna) y hay un botón **“Copiar pedido”**.
- La ventana muestra los pasos para enviar el pedido y el botón **“Continuar”**
  abre el perfil de la red en otra pestaña para pegar el mensaje.
- El helper `productOrderMessage` centraliza el texto del pedido y tiene pruebas
  en `frontend/src/channels.test.js`.

## v0.6 — Pagos manuales, cuenta bancaria y sesión persistente

### Cobro de la suscripción (manual)

- `Subscription` (app `tenants`) con estado calculado en vivo: `active`,
  `past_due` (10 días de gracia) y `suspended`. El plan se cobra cada 30 días.
- El panel exige un plan activo: sin suscripción muestra el **bloqueo de
  activación** (`PaymentGate`) con los datos de la cuenta para depositar y el
  formulario del comprobante (foto **obligatoria**).
- `Payment` (app `payments`): el dueño solo puede **subir el comprobante**
  (`POST /payments/`, queda `pending`); ver y gestionar pagos es exclusivo del
  superusuario. `POST /payments/<id>/activate/` aprueba el pago y activa/renueva
  la suscripción 1 mes.

### Cuenta bancaria configurable

- Los datos de la cuenta (`BillingInfo`, fila única) viven en la **base de
  datos** —no en el código— y se editan desde el panel del superusuario, sin
  redeploy. Migraciones `payments/0002` (tabla) y `0003` (siembra inicial).
- `GET /payments/billing/` (autenticado) los devuelve; `PUT/PATCH` solo
  superusuario.

### Sesión persistente

- El frontend **renueva el access token** con el refresh token ante un `401` y
  repite la petición: la sesión dura hasta 30 días sin volver a loguearse (antes
  se borraban los tokens al primer `401`, aun con refresh válido).

### Verificación de deploy

- `GET /version/` devuelve el commit desplegado (`commit`, `short`, `branch`) a
  partir de `RENDER_GIT_COMMIT`/`RENDER_GIT_BRANCH` de Render.

### Otros

- WhatsApp de soporte actualizado a `+50236237067` (`SUPPORT_WHATSAPP`).

## v0.5 — El slug de la tienda sigue al nombre

- Al **renombrar** una tienda, su `slug` se regenera a partir del nuevo nombre
  (antes se generaba solo al crear y quedaba fijo).
- Se mantiene la **unicidad**: si el slug ya existe, se agrega un sufijo
  `-2`, `-3`, … (excluyendo la propia tienda).
- Si el nombre se guarda sin cambios (u otra edición: canales, colores, etc.),
  el slug **no cambia**. Un nombre sin letras usa el fallback `tienda`.
- ⚠️ El enlace público `/tienda/<slug>` **cambia al renombrar**: los links
  compartidos con el slug anterior dejan de funcionar (esto revierte la
  decisión de "slug estable" de v0.2).
- Pruebas: `tenants/tests.py` (modelo y API).

## v0.4 — Ventas y consultas por Instagram, Facebook y TikTok

- Cada tienda elige **por qué canales recibe pedidos**. `Tenant.purchase_channels`
  es una lista (`JSONField`, por defecto vacía); migraciones `tenants/0010`
  (esquema) y `tenants/0011` (datos: las tiendas que ya tenían número conservan
  **WhatsApp**, para no cambiar su comportamiento).
- Canales disponibles: **WhatsApp, Instagram, Facebook y TikTok**. **LinkedIn
  queda fuera a propósito**: es una red de contacto, no un canal de compra, y
  sigue apareciendo solo como enlace en la tienda.
- Fuente única de verdad: `backend/tenants/channels.py` (backend) y
  `frontend/src/channels.js` (panel), con las mismas etiquetas, íconos y orden.
- **No se puede activar un canal sin un destino válido**: WhatsApp necesita
  dígitos (el resto lo arma `wa.me`) y las redes necesitan una URL `http(s)`
  completa. La selección se normaliza, se ordena y se ignoran duplicados.
- El storefront público (`/public/<slug>/`) expone solo los **canales efectivos**
  (activados *y* con destino válido): nunca un botón sin enlace.
- Panel: sección **Canales de compra** en Tiendas, con interruptores y aviso del
  dato que falta para cada canal.
- Tienda pública: un **botón por canal activo**. WhatsApp dice **"Comprar por
  WhatsApp"**; Instagram, Facebook y TikTok dicen **"Preguntar por …"** (en redes
  se escribe para consultar, no se compra directo).
- Pruebas: `tenants/tests_channels.py`, `storefront/tests.py` y
  `frontend/src/channels.test.js`.

## v0.3 — Paletas de color por tienda

- `Tenant` guarda su configuración visual: `theme_primary`, `theme_secondary`,
  `theme_background` y `theme_text` (hexadecimales validados; migración
  `tenants/0006`). El valor por defecto es la paleta **Azul**, por lo que las
  tiendas existentes no cambian de apariencia.
- Catálogo de paletas con **una única definición** en `tenants/theme.py`
  (Azul, Rosa, Verde, Morado, Café, Oscuro, Turquesa y Negro y amarillo)
  expuesto en `GET /tenants/palettes/`.
- `PATCH /tenants/tenant/<id>/` acepta `theme_palette` (clave de paleta) o
  colores hexadecimales sueltos; la lectura se expone en `theme`.
- El storefront público devuelve los colores en `theme` y el frontend los aplica
  como variables CSS por tienda (`frontend/src/theme.js`). Aislamiento por
  membresía en el backend; fallback a Azul si falta la configuración.
- Panel: nueva sección **Apariencia** (`/admin/apariencia`) con muestras de cada
  paleta, selección, estado de guardado y errores.
- Pruebas: `tenants/tests.py`, `storefront/tests.py` y `frontend/src/theme.test.js`.

## v0.1.1 — Redes sociales en la tienda

- `Tenant` suma redes sociales **opcionales**: Instagram, Facebook, TikTok y
  LinkedIn (`URLField(blank=True, null=True)`; migración `tenants/0003`).
- Los serializers (panel de tiendas y tienda pública) exponen las URLs.
- Frontend: campos de edición en el panel y **enlaces en la tienda pública**
  (`/tienda/<slug>`) bajo la descripción.
- Nota: el campo se normalizó a `instagram_url` (el typo inicial
  `instragram_url` se renombró con las migraciones `tenants/0004` + `0005`).

## v0.2 — Producción (Render + Neon + Vercel)

Backend live en `https://libredrop.onrender.com`, frontend en
`https://libredrop-cloud.vercel.app`.

- Imagen Docker en la **raíz** del repo (solo backend; sin base de datos
  empaquetada). Build: `docker build -t libredrop-api .` desde la raíz.
- **Neon** como Postgres externo vía `DATABASE_URL` (endpoint pooled,
  `?sslmode=require`).
- **Migraciones automáticas** en cada deploy: `scripts/release.sh` llamada por
  `entrypoint.sh` al arrancar y por el `preDeployCommand` de Render.
- `SECRET_KEY` generada manualmente con `get_random_secret_key` (render.yaml
  `sync: false`; no se commitea).
- **Vercel**: `VITE_API_URL` horneada en el build (prefijo `VITE_` público a
  propósito; no es un secreto). Rewrite de SPA en `frontend/vercel.json`.
- **Imágenes comprimidas a WebP**: `public` 23 MB → 344 KB, `dist` 23 MB → 576 KB
  (refs actualizadas en `AdminAuth.jsx`/`AdminApp.jsx`; eliminadas
  `libredrop_cloud*.jpg` y `libredrop_icon.png` sin uso).
- **Cloudinary con entrega optimizada** `f_auto,q_auto` en tenants/catalog/
  storefront (+ helper `images.optimized()` y 5 tests).
- CORS/CSRF para el origen de Vercel; WhiteNoise sirve los estáticos;
  `SECURE_SSL_REDIRECT` en prod.
- Slug de tienda **estable**: se genera una vez al crear y renombrarla ya no lo
  cambia (antes se regeneraba y rompía los links públicos). *(Revertido en v0.5:
  ahora el slug sigue al nombre.)*
- Pendiente (opcionales): límites de ancho `w_...` en Cloudinary y limpieza de
  imágenes pequeñas sin uso.

## v0.1 — En progreso (rehecha)

Se rehizo desde cero por cambio de arquitectura en multitenancy:

- Se abandona multitenancy por **schemas**.
- Se adopta multitenancy **lineal por `tenant_id`**: mismas tablas, cada registro con su `tenant_id`.

### Backend

- `accounts`: registro, login JWT (`/auth/register/`, `/auth/login/`, `/auth/token/refresh/`).
- `tenants`: CRUD de tiendas (`/tenants/tenant/`) y miembros (`/tenants/tenants/:id/members/`).
- `catalog`: categorías y productos por tenant (`/catalog/tenants/:id/categories/`, `.../products/`).
- `storefront`: tienda pública sin JWT (`/public/<slug>/`) con logo, whatsapp, categorías y productos activos.
- Imágenes (logo/producto) devueltas como URL completa de Cloudinary en todos los serializers.
- Cloudinary configurado vía `CLOUDINARY_*` (.env) y `STORAGES` (Django 6.1).
- JWT: access 1 día, refresh 30 días.
- Filtrado por membresía del usuario en cada queryset.
- Sin `django-tenants`, sin Docker ni nginx por ahora.

### Frontend

- `/` redirige a `/admin` (login/registro si no hay sesión).
- Panel: Tiendas (con botón "Compartir tienda" que copia el enlace) y Catálogo.
- Tienda pública (`/tienda/<slug>`): cabecera de marca (logo, nombre, descripción, botón "Contactar por WhatsApp"), título de pestaña con el nombre de la tienda, categorías en chips, buscador de productos, modal de detalle al tocar el nombre del producto y botón "Comprar por WhatsApp" verde con mensaje `Hola <tienda>, me gustaria comprar este producto: <producto>. ¿Aun tienen a la venta?`. Adaptada a teléfonos.
- Vite proxy `/api` → `http://localhost:8000`.
- Pendiente: catálogo público/storefront y dominio por tenant.

### Pendiente

- Middleware/contexto de tenant actual por request.
- Endpoint `/me/` para obtener el usuario actual.
- `MembershipSerializer`: exponer `user` y `role` como escribibles.
- Storefront público por tenant.
