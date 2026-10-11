FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# libpq: lo necesita psycopg (v3) para conectarse a Postgres.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# El contexto de build es la raíz del repo (ver .dockerignore).
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

RUN chmod +x entrypoint.sh scripts/release.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
