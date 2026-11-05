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
`frontend/src/channels.js`. El texto que precede al canal se personaliza por
tienda con `Tenant.purchase_button_text` (por defecto **“Comprar por”**); si está
vacío o el backend no lo expone, el frontend usa ese valor predeterminado.

El cobro es **manual**: el dueño sube un comprobante (`Payment`, estado
`pending`) y el superusuario lo aprueba (`POST /payments/<id>/activate/`), lo que
activa/renueva la suscripción de la tienda por 30 días. `Subscription` (app
`tenants`) se calcula en vivo: `active`, `past_due` (10 días de gracia) y
`suspended`. Los datos de la cuenta bancaria (`BillingInfo`) viven en la base de
datos (fila única) y se editan desde el panel del superusuario.

Las **ofertas** se guardan en `Product.discount_percent` (entero de 1 a 99).
Si hay `price`, el frontend calcula el precio rebajado y muestra ambos precios;
sin precio normal muestra solo el porcentaje. El filtro “Ofertas” se basa en
ese campo. La migración 0010 conserva los descuentos existentes al retirar
`Product.sales_price`.

Cada producto puede tener hasta **5 fotos** en `image` + `image2`…`image5`. La
primera es la portada de la tarjeta; el resto se muestra en la ventana que abre
el enlace **“Ver detalles…”**, ubicado debajo de la descripción y antes de los
botones de compra.

Imágenes (logo, producto) se suben a Cloudinary y los serializers devuelven la
URL completa con entrega optimizada `f_auto,q_auto` (WebP/AVIF + calidad
automática) vía el helper `backend/backend/images.py::optimized()`.
Config vía variables de entorno `CLOUDINARY_*`.

## Frontend

React SPA (Vite). Páginas:

- `/` → redirige a `/admin` (login/registro si no hay sesión).
- `/admin` — panel: Tiendas (con **canales de compra**), Catálogo, Apariencia y
  Pagos (suscripción; si el plan no está activo el panel muestra el bloqueo de
  activación). Al entrar se muestra una ventana de **Novedades** con la última
  actualización; al abrirla desde el botón **Novedades** o **Ver Novedades** se
  ve el historial completo separado por número y fecha. Se controla desde
  `frontend/src/updates.js` y se recuerda por usuario con `localStorage`.
- `/tienda/<slug>` — tienda pública: cabecera con logo/nombre, botón
  "Contactar por WhatsApp", chips de categorías, buscador, modal de detalle y
  **botones de compra por canal**: el texto es configurable por tienda
  (`purchase_button_text`, por defecto "Comprar por"), así que puede verse "Comprar por
  WhatsApp" o "Pedir por Instagram". En las redes sociales se abre una ventana con
  el pedido copiable y los pasos para pegarlo en el chat; WhatsApp abre el chat
  directo con el mensaje. Los productos con oferta muestran el precio rebajado,
  el anterior tachado, el porcentaje de descuento y el filtro **“Ofertas”**.
  Debajo de la descripción aparece **“Ver detalles…”**, que abre la galería con
  las fotos subidas, el precio y los botones de compra. Responsive.

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
