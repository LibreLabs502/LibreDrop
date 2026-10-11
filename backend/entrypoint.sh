#!/bin/sh
set -e

echo "→ Migrando base de datos..."
python manage.py migrate --noinput

echo "→ Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "→ Levantando Gunicorn..."
exec gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile -
