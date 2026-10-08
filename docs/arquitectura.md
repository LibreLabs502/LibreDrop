# Arquitectura

## Multitenancy

Multitenancy **lineal por `tenant_id`**: mismas tablas para todos, cada registro
lleva su `tenant_id`. No se usa `django-tenants` ni schemas por tienda.
Los querysets filtran por membresía del usuario autenticado.

## Backend

Django 6.1 + DRF. Apps:

- `accounts` — modelo `User` propio y autenticación JWT.
- `tenants` — tiendas y miembros (roles).
- `catalog` — categorías y productos por tienda.
- `storefront` — API pública de la tienda (sin auth).

Imágenes (logo, producto) se suben a Cloudinary y los serializers devuelven la
URL completa. Config vía variables de entorno `CLOUDINARY_*`.

## Frontend

React SPA (Vite). Páginas:

- `/` → redirige a `/admin` (login/registro si no hay sesión).
- `/admin` — panel: Tiendas y Catálogo.
- `/tienda/<slug>` — tienda pública: cabecera con logo/nombre, botón
  "Contactar por WhatsApp", chips de categorías, buscador, modal de detalle y
  botón "Comprar por WhatsApp". Responsive.

Estado de sesión en `AuthContext` + tokens en `localStorage`.
