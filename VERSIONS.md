# Versiones

## v0.1 — En progreso (rehecha)

Se rehizo desde cero por cambio de arquitectura en multitenancy:

- Se abandona multitenancy por **schemas**.
- Se adopta multitenancy **lineal por `tenant_id`**: mismas tablas, cada registro con su `tenant_id`.

Arquitectura actual del backend:

- `accounts`: usuarios y autenticación.
- `tenants`: tenants, membresías y slug por tenant.
- Filtrado por `tenant_id` en consultas y permisos.
- Sin `django-tenants`, sin Docker ni nginx por ahora.
