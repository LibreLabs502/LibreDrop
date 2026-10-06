# Versiones

## v0.1 — En progreso (rehecha)

Se rehizo desde cero por cambio de arquitectura en multitenancy:

- Se abandona multitenancy por **schemas**.
- Se adopta multitenancy **lineal por `tenant_id`**: mismas tablas, cada registro con su `tenant_id`.

### Backend

- `accounts`: registro, login JWT (`/auth/register/`, `/auth/login/`, `/auth/token/refresh/`).
- `tenants`: CRUD de tiendas (`/tenants/tenant/`) y miembros (`/tenants/tenants/:id/members/`).
- `catalog`: categorías y productos por tenant (`/catalog/tenants/:id/categories/`, `.../products/`).
- Filtrado por membresía del usuario en cada queryset.
- Sin `django-tenants`, sin Docker ni nginx por ahora.

### Frontend

- `/` redirige a `/admin` (login/registro si no hay sesión).
- Panel: Tiendas, Miembros y Catálogo.
- Vite proxy `/api` → `http://localhost:8000`.
- Pendiente: catálogo público/storefront y dominio por tenant.

### Pendiente

- Middleware/contexto de tenant actual por request.
- Endpoint `/me/` para obtener el usuario actual.
- `MembershipSerializer`: exponer `user` y `role` como escribibles.
- Storefront público por tenant.
