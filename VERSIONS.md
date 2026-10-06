# Versiones

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
