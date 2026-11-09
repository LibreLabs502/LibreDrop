# LibreDrop

Plataforma multitenant para catálogos de tiendas públicas con pedidos y consultas por WhatsApp, Instagram, Facebook y TikTok.

## Stack

- **Backend**: Django 6.1 + DRF + SimpleJWT + Postgres + Cloudinary (imágenes)
- **Frontend**: React 18 + Vite + React Router

## Funciones principales

- Catálogos por tienda con categorías normales y de temporada, productos
  destacados y hasta cinco fotos por producto.
- Ofertas con precio normal, precio de oferta, porcentaje opcional y fecha de
  vencimiento. La tienda muestra una cuenta regresiva mientras la oferta está
  activa; al vencer, deja de contar como oferta.
- Tienda pública con carruseles de temporada, ofertas y destacados. Cada uno
  muestra tres fotos por tanda y solo aparece con tres o más productos con foto;
  las colecciones siguen disponibles en los filtros aunque tengan menos.
- Al elegir **Temporada**, aparecen sus subcategorías debajo del buscador para
  filtrar los productos por ocasión.
- Fotos, colores y contenido visual adaptados a la paleta de cada tienda y a
  pantallas móviles.

## Estructura

```
backend/    API Django (accounts, tenants, catalog, storefront, payments)
frontend/   SPA React (admin + tienda pública)
docs/       Documentación
```

## Inicio rápido

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# crear backend/.env con SECRET_KEY, DB_*, CLOUDINARY_* (ver docs/instalacion.md)
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev   # http://127.0.0.1:5173, proxy /api → :8000
```

API docs (Swagger): `http://localhost:8000/docs/`

## Producción (live)

- **API**: https://libredrop.onrender.com — Docker en Render + Postgres en Neon (`DATABASE_URL`), migraciones automáticas en cada deploy.
- **App**: https://libredrop-cloud.vercel.app — SPA React; `VITE_API_URL` apunta al backend.

> Detalle paso a paso en [docs/despliegue.md](docs/despliegue.md).

## Documentación

- [Instalación y configuración](docs/instalacion.md)
- [Despliegue (Render + Neon + Vercel)](docs/despliegue.md)
- [API / Endpoints](docs/api.md)
- [Arquitectura y multitenancy](docs/arquitectura.md)
- [Historial de versiones](VERSIONS.md)
