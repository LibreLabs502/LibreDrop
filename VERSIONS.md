# Versiones

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
  (Azul, Rosa, Verde, Morado, Café, Oscuro) expuesto en `GET /tenants/palettes/`.
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
