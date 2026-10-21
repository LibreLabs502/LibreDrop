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
`frontend/src/channels.js`.

El cobro es **manual**: el dueño sube un comprobante (`Payment`, estado
`pending`) y el superusuario lo aprueba (`POST /payments/<id>/activate/`), lo que
activa/renueva la suscripción de la tienda por 30 días. `Subscription` (app
`tenants`) se calcula en vivo: `active`, `past_due` (10 días de gracia) y
`suspended`. Los datos de la cuenta bancaria (`BillingInfo`) viven en la base de
datos (fila única) y se editan desde el panel del superusuario.

Imágenes (logo, producto) se suben a Cloudinary y los serializers devuelven la
URL completa con entrega optimizada `f_auto,q_auto` (WebP/AVIF + calidad
automática) vía el helper `backend/backend/images.py::optimized()`.
Config vía variables de entorno `CLOUDINARY_*`.

## Frontend

React SPA (Vite). Páginas:

- `/` → redirige a `/admin` (login/registro si no hay sesión).
- `/admin` — panel: Tiendas (con **canales de compra**), Catálogo, Apariencia y
  Pagos (suscripción; si el plan no está activo el panel muestra el bloqueo de
  activación).
- `/tienda/<slug>` — tienda pública: cabecera con logo/nombre, botón
  "Contactar por WhatsApp", chips de categorías, buscador, modal de detalle y
  **botones de compra por canal**: "Comprar por WhatsApp" y "Preguntar por
  Instagram / Facebook / TikTok". Responsive.

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
