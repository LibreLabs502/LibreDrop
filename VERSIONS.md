# Versiones

## v0.1.1 — Redes sociales en la tienda

- `Tenant` suma redes sociales **opcionales**: Instagram, Facebook, TikTok y
  LinkedIn (`URLField(blank=True, null=True)`; migración `tenants/0003`).
- Los serializers (panel de tiendas y tienda pública) exponen las URLs.
- Frontend: campos de edición en el panel y **enlaces en la tienda pública**
  (`/tienda/<slug>`) bajo la descripción.
- Nota interna: el campo del modelo quedó como `instragram_url` (typo de
  "instagram"); funciona igual, renombrar a `instagram_url` queda como
  limpieza futura si se quiere.

## v0.2 — Producción (Render + Neon + Vercel)

Backend live en `https://libredrop.onrender.com`, frontend en
`https://libredrop-app.vercel.app`.

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
  cambia (antes se regeneraba y rompía los links públicos).
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
