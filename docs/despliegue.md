# Despliegue

Arquitectura de producción:

```
Navegador
   │
   ├── Frontend (React)      → Vercel        (HTTPS gratis)
   │
   └── API (Django/Gunicorn) → Render (Docker)
                                  └── Postgres → Neon (DB externa, por URL)
```

- **Backend**: Render, construido desde el `Dockerfile` de la raíz.
- **Base de datos**: Neon (Postgres serverless), configurada con `DATABASE_URL`.
- **Frontend**: Vercel (build estático de Vite).
- **Imágenes**: Cloudinary.

El backend corre con `DEBUG=False` y `SECURE_SSL_REDIRECT`; Render termina el
TLS y envía `X-Forwarded-Proto`, que Django reconoce. Los estáticos los sirve
**WhiteNoise** (no hace falta Nginx). El contenedor **no incluye base de datos**.

---

## 1. Neon (base de datos)

1. Creá una cuenta en https://neon.tech y un proyecto.
2. Copiá el **connection string**. Recomendado: usá el endpoint *pooled*
   (el host contiene `-pooler`), ideal para apps con conexiones cortas.
3. Tiene esta forma (dejá el `?sslmode=require`):
   ```
   postgresql://usuario:clave@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Guardala: es el `DATABASE_URL`.

Las migraciones se aplican solas en **cada deploy** (ver
"Migraciones en cada deploy").

## 2. Backend en Render

### Opción A (recomendada): blueprint `render.yaml`
El repo ya trae `render.yaml`. En Render: **New → Blueprint**, conectá el repo y
Render crea el servicio `libredrop-api` (Docker). Luego completá las variables
marcadas `sync: false` en el dashboard:

- `DATABASE_URL` → connection string de Neon.
- `ALLOWED_HOST` → tu dominio del API (ej. `api.tudominio.com`). Si vas a usar el
  `*.onrender.com`, podés dejarlo vacío: Render agrega su hostname solo.
- `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` → la URL de Vercel.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

`SECRET_KEY` la **generás vos** y la pegás acá:
`python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"`.
`DEBUG=False` y `DB_SSL_REQUIRE=True` ya vienen seteados por el blueprint.

### Opción B: manual
**New → Web Service → Docker**:
- Root Directory: *(dejar vacío: es la raíz del repo)*
- Dockerfile Path: `Dockerfile`
- Health Check Path: `/health/`
- **Pre-Deploy Command**: `sh scripts/release.sh`
- Environment: las mismas variables de arriba.

### Migraciones en cada deploy
`backend/scripts/release.sh` corre `python manage.py migrate`. Se ejecuta en dos
puntos, para que nunca falten:

- **Al arrancar el contenedor** (`entrypoint.sh` lo llama): funciona siempre,
  aunque el servicio se haya creado manual sin pre-deploy.
- **Pre-Deploy Command** de Render (`preDeployCommand` en `render.yaml`), si el
  blueprint está aplicado: corre antes de que la nueva versión reciba tráfico;
  si una migración falla, el deploy se aborta y sigue viva la versión anterior.

`migrate` es idempotente, así que correrlo en ambos lados no molesta.

### Dominio propio (opcional)
En Render: **Settings → Custom Domain**, agregá `api.tudominio.com` y creá el
registro CNAME que te indique. Luego asegurate de que `ALLOWED_HOST` incluya ese
dominio.

### Verificar
```bash
curl https://TU-SERVICIO.onrender.com/health/     # {"status": "ok"}
```

## 3. Frontend en Vercel

1. **Add New → Project**, importá el repo.
2. **Root Directory**: `frontend`.
3. Vercel detecta Vite (`npm run build` → `dist`).
4. **Settings → Environment Variables**: `VITE_API_URL` = `https://TU-SERVICIO.onrender.com`
   (o tu dominio propio, sin barra final).
5. **Deploy**.

`frontend/vercel.json` ya incluye el rewrite de SPA para que `/admin`,
`/admin/catalogo` y `/tienda/<slug>` funcionen al recargar.

### Cerrar el CORS
Cuando Vercel te dé la URL final, confirmá que sea idéntica a
`CORS_ALLOWED_ORIGINS` en Render (protocolo + dominio, sin barra final) y
redeployá el backend. Para que funcionen también los **preview deployments**:
```env
CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.vercel\.app$
```

---

## 4. Probar la imagen en local (opcional)

La imagen contiene **solo el backend**. No hay base de datos empaquetada:
apuntá `DATABASE_URL` a tu Neon.

```bash
# El build se hace desde la RAÍZ del repo (contexto = raíz).
docker build -t libredrop-api .

docker run --rm -p 8000:8000 --env-file .env.render --entrypoint sh libredrop-api \
  -c "sh scripts/release.sh && exec ./entrypoint.sh"

curl http://localhost:8000/health/     # {"status": "ok"}
```

(`cp .env.production.example .env.render` y completá `DATABASE_URL` + secretos.)

## 5. Operación

- **Migraciones**: `entrypoint.sh` (al arrancar) y, si hay pre-deploy, también ahí.
- **Estáticos**: `collectstatic` corre al arrancar; los sirve WhiteNoise.
- **Backups**: los maneja Neon (tiene su propio historial/restore).
- **Variables**: se cambian en el dashboard de Render → redeploy.

## 6. Preguntas frecuentes

- **Error de CORS**: `CORS_ALLOWED_ORIGINS` debe ser idéntico al origen del
  frontend (con `https://`, sin barra final).
- **`DisallowedHost`**: agregá el dominio a `ALLOWED_HOST`.
- **No conecta a Neon**: revisá que la URL tenga `?sslmode=require` (o
  `DB_SSL_REQUIRE=True`) y que sea la cadena *pooled*.
- **No sube imágenes**: faltan las credenciales `CLOUDINARY_*`.
- **`failed to read dockerfile: open Dockerfile`**: el Dockerfile debe estar en
  la **raíz del repo** (Render lo busca ahí por defecto). Si lo movés, ajustá
  `Dockerfile Path` / `Root Directory` en Render.
- **Cold starts**: el plan `free` de Render duerme; usá `starter` para producción.
