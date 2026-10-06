# Versiones

## v0.1 — En progreso (rehecha)

Se rehizo desde cero por cambio de arquitectura en multitenancy:

- Se abandona multitenancy por **schemas**.
- Se adopta multitenancy **lineal por `tenant_id`**: mismas tablas, cada registro con su `tenant_id`.

Arquitectura actual del backend:

- `accounts`: usuarios y autenticación (serializers y vistas listas).
- `tenants`: tenants, membresías y slug por tenant (serializers, urls y vistas listos).
- Filtrado por `tenant_id` en consultas y permisos.
- Sin `django-tenants`, sin Docker ni nginx por ahora.
- Landing de plataforma con branding propio (logo, hero y favicon en `frontend/public/images`).
- Frontend adaptado al nuevo backend (en desarrollo, sin commitear):
  - `/` redirige a `/admin` (login/registro si no hay sesión).
  - Panel con Tiendas y Miembros.
  - Pendiente: catálogo, storefront público y dominio por tenant.

Pendiente:

- Middleware/contexto de tenant actual por request.
- Managers que filtren por `tenant_id`.
- Modelos de dominio (catálogo, órdenes, clientes) con `tenant_id` (`catalog` iniciado).
