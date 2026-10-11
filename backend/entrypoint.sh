#!/bin/sh
set -e

PORT="${PORT:-8000}"

echo "→ Migrando base de datos..."
python manage.py migrate --noinput

echo "→ Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "→ Levantando Gunicorn en 0.0.0.0:${PORT}..."
exec gunicorn backend.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers "${WEB_CONCURRENCY:-${GUNICORN_WORKERS:-3}}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile -
