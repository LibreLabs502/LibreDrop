#!/bin/sh
# Script de release: se ejecuta en CADA deploy, antes de que la nueva version
# reciba trafico (en Render: `preDeployCommand`, ver render.yaml).
# Si las migraciones fallan, el deploy se aborta y sigue viva la version anterior.
set -e

echo "→ Aplicando migraciones..."
python manage.py migrate --noinput
echo "→ Migraciones aplicadas OK."
