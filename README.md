# LibreDrop

Plataforma multitenant para catálogos de tiendas públicas con carrito vía WhatsApp.

## Stack

- **Backend**: Django 6.1 + DRF + SimpleJWT + Postgres + Cloudinary (imágenes)
- **Frontend**: React 18 + Vite + React Router

## Estructura

```
backend/    API Django (accounts, tenants, catalog, storefront)
frontend/   SPA React (admin + tienda pública)
docs/       Documentación
```

## Inicio rápido

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # completar valores
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

## Documentación

- [Instalación y configuración](docs/instalacion.md)
- [API / Endpoints](docs/api.md)
- [Arquitectura y multitenancy](docs/arquitectura.md)
