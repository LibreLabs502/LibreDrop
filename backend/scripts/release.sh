#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# LibreDrop · migraciones para Render (se ejecuta en CADA deploy)
#
# Dos puntos de entrada, para que nunca falten:
#   1) Render → Settings → Pre-Deploy Command:  sh scripts/release.sh
#      (corre antes de que la nueva versión reciba tráfico)
#   2) entrypoint.sh:  sh scripts/release.sh   (al arrancar el contenedor)
#
# `migrate` es idempotente: si no hay migraciones nuevas, no hace nada.
# Si algo falla, el script termina con error y el deploy se aborta,
# dejando viva la versión anterior.
# ─────────────────────────────────────────────────────────────────────────────
set -e

# Ubicarse en la carpeta que contiene manage.py (funciona desde cualquier cwd).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "→ Migraciones pendientes:"
python manage.py showmigrations --plan | grep -E '^\[ \]' || echo "   (ninguna)"

echo "→ Aplicando migraciones…"
python manage.py migrate --noinput

echo "→ Migraciones aplicadas. MIGRATIONS_OK"
