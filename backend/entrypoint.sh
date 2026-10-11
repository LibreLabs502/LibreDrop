#!/bin/sh
# Arranque del proceso web. Las migraciones NO se corren acá: se ejecutan en el
# pre-deploy (`scripts/release.sh`) para que cada deploy las aplique una sola vez.
set -e

PORT="${PORT:-8000}"

echo "→ Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "→ Levantando Gunicorn en 0.0.0.0:${PORT}..."
exec gunicorn backend.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers "${WEB_CONCURRENCY:-${GUNICORN_WORKERS:-3}}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile -
