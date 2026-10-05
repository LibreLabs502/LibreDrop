# Versiones

## v0.1 — Rehacer (descartada)

La versión 0.1 se rehara desde cero. El motivo principal es un cambio de arquitectura
en el multitenancy:

- Se abandona el enfoque de **multitenancy por schemas** (un schema de base de datos
  por tenant).
- Se adopta **multitenancy lineal por ID**: todos los tenants comparten las mismas
  tablas y cada registro lleva un `tenant_id` que identifica al tenant dueño.

Consecuencias:

- Se elimina todo el código de enrutamiento por schema (`django-tenants`,
  middleware de schema, etc.).
- Los modelos pasan a incluir `tenant_id` y las consultas/permisos se filtran por él.
- El backend y las migraciones se reescriben para esta estrategia.

La v0.1 con schemas queda obsoleta y no se continúa.
