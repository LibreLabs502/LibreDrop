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

DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

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

## Producción (pendiente)

Sin Docker/nginx por ahora. Para producción: `npm run build`, `DEBUG=False`,
ALLOWED_HOSTS real y servir el build detrás de un reverse proxy.
