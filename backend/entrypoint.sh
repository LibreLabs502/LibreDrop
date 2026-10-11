#!/bin/sh
# Arranque del proceso web: aplica migraciones, recolecta estáticos y levanta
# Gunicorn. Las migraciones corren acá para que el contenedor sea
# autosuficiente: funciona aunque el pre-deploy de Render no esté configurado
# (si lo está, también las corre ahí; `migrate` es idempotente).
set -e

PORT="${PORT:-8000}"

sh scripts/release.sh

echo "→ Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "→ Levantando Gunicorn en 0.0.0.0:${PORT}..."
exec gunicorn backend.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers "${WEB_CONCURRENCY:-${GUNICORN_WORKERS:-3}}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile -
