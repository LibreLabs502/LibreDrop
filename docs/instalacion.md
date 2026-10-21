# Instalación y configuración

## Requisitos

- Python 3.12+ y Postgres
- Node 18+
- Cuenta de Cloudinary (para imágenes)

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Crear `backend/.env`:

```env
SECRET_KEY=...
DEBUG=True
ALLOWED_HOST=localhost,127.0.0.1
DB_SSL_REQUIRE=False

DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432

# Frontend en dev (Vite en :5173):
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

> Si preferís usar la base remota de Neon también en local, usá `DATABASE_URL`
> (sin `&channel_binding=require`) con `DB_SSL_REQUIRE=True` y dejá las `DB_*`
> vacías.

```bash
python manage.py migrate
python manage.py runserver   # :8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev   # http://127.0.0.1:5173
```

Vite proxya `/api/*` al backend en `:8000` (ver `frontend/vite.config.js`).
Tokens JWT se guardan en `localStorage` (`libredrop_access`, `libredrop_refresh`).
El access token (1 día) se renueva solo con el refresh token (30 días) cuando
vence, así la sesión no se pierde.

## Producción

El despliegue real (backend en **Render** con Docker, base de datos **Neon** por
`DATABASE_URL`, frontend en **Vercel**) está documentado paso a paso en
[despliegue.md](despliegue.md).
