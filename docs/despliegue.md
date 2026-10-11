# Despliegue

Arquitectura de producción:

```
Navegador
   │
   ├── Frontend (React)      → Vercel           https://libredrop-app.vercel.app
   │
   └── API (Django/Gunicorn) → Render (Docker)  https://libredrop.onrender.com
                                    └── Postgres → Neon (DB externa, por URL)
```

- **Backend**: Render, imagen Docker construida desde el `Dockerfile` de la raíz.
- **Base de datos**: Neon (Postgres serverless), configurada con `DATABASE_URL`.
- **Frontend**: Vercel (build estático de Vite).
- **Imágenes**: Cloudinary, con entrega optimizada `f_auto,q_auto`
  (WebP/AVIF + calidad automática) en las URLs que devuelven los serializers.

El backend corre con `DEBUG=False`; Render termina TLS y envía
`X-Forwarded-Proto`, que Django reconoce (`SECURE_PROXY_SSL_HEADER`). Los
estáticos los sirve **WhiteNoise** (no hace falta Nginx). El contenedor
**no incluye base de datos**.

---

## 1. Neon (base de datos)

1. Creá un proyecto en https://neon.tech.
2. Copiá el **connection string** del endpoint **pooled** (el host contiene
   `-pooler`), ideal para apps con muchas conexiones cortas.
3. Tiene esta forma (dejá el `?sslmode=require`):
   ```
   postgresql://usuario:clave@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
   > Si el deploy falla al conectar y tu URL trae `&channel_binding=require`,
   > probá **quitándolo** (dejá solo `?sslmode=require`).
4. Guardala: es el `DATABASE_URL`.

Las migraciones se aplican solas en cada deploy (ver "Migraciones en cada deploy").

## 2. Backend en Render

### Variables de entorno

En Render las variables van en **Dashboard → libredrop-api → Environment**
(Render **no lee archivos `.env`**). Este es el set completo:

| Variable | Valor |
|---|---|
| `SECRET_KEY` | generada vos (ver abajo). **No dejarla vacía.** |
| `DEBUG` | `False` (lo pone el blueprint) |
| `DATABASE_URL` | connection string de Neon (pooled, `?sslmode=require`) |
| `DB_SSL_REQUIRE` | `True` (lo pone el blueprint) |
| `ALLOWED_HOST` | **vacío**. Render agrega el `.onrender.com` solo |
| `CORS_ALLOWED_ORIGINS` | `https://libredrop-app.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://libredrop-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | tu cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | tu API key |
| `CLOUDINARY_API_SECRET` | tu API secret |

Generar la `SECRET_KEY` (usa `secrets`):

```bash
python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
```

`DEBUG=True` localmente y `False` en prod van separados: no reuses el `.env`
local para Render, ni al revés.

### Opción A (recomendada): blueprint `render.yaml`

El repo trae `render.yaml`. En Render: **New → Blueprint**, conectá el repo.
Render crea `libredrop-api` (Docker). Completás en el dashboard las variables
con `sync: false` (`SECRET_KEY`, `DATABASE_URL`, `CORS_*`, `CLOUDINARY_*`);
`DEBUG` y `DB_SSL_REQUIRE` ya vienen seteadas por el blueprint.

### Opción B: manual

**New → Web Service → Docker**:

- Root Directory: *(vacío: raíz del repo)*
- Dockerfile Path: `Dockerfile`
- Health Check Path: `/health/`
- **Pre-Deploy Command**: `sh scripts/release.sh`
- Environment: la tabla de variables de arriba.

### Migraciones en cada deploy

`backend/scripts/release.sh` corre `python manage.py migrate`. Se ejecuta en
**dos puntos**, para que nunca falten:

- **Al arrancar el contenedor**: `entrypoint.sh` lo llama siempre
  (funciona aunque no haya pre-deploy configurado).
- **Pre-Deploy Command** de Render (`preDeployCommand` en `render.yaml`): corre
  antes de que la nueva versión reciba tráfico; si falla, el deploy se aborta y
  sigue viva la versión anterior.

`migrate` es idempotente: correrlo en ambos lados no molesta.

### Dominio propio (opcional)

En Render: **Settings → Custom Domain**, agregá `api.tudominio.com` y el CNAME
que indique. Ahí sí agregá ese dominio a `ALLOWED_HOST`.

### Verificar el backend

```bash
curl https://libredrop.onrender.com/health/     # {"status": "ok"}
```

## 3. Frontend en Vercel

1. **Add New → Project** → importá el repo.
2. **Root Directory**: `frontend`.
3. Vercel detecta Vite (`npm run build` → `dist`).
4. **Settings → Environment Variables**:
   ```
   VITE_API_URL=https://libredrop.onrender.com
   ```
   (sin barra final, **sin** `/api`).
5. **Deploy** (y cada vez que cambies la variable: **Redeploy** — Vite la
   hornea en el build, no se lee en runtime).

> Vercel puede mostrar la advertencia *"Remove the public framework prefix"*:
> es esperable e inofensiva. **No le quites el prefijo `VITE_`** — es lo que
> permite que el navegador sepa dónde está la API (no es un secreto). Tampoco
> la cambies a privada/`Config`: el bundle quedaría sin la URL y la app rompe.

`frontend/vercel.json` ya incluye el rewrite de SPA para que `/admin`,
`/admin/catalogo` y `/tienda/<slug>` funcionen al recargar.

### Previews de Vercel (opcional)

Para que los deploy preview (ramas/PRs) también pasen CORS, agregá en Render:

```env
CORS_ALLOWED_ORIGIN_REGEXES=^https://libredrop-app.*\.vercel\.app$
```

(O una regex más amplia: `^https://.*\.vercel\.app$`.)

## 4. Probar la imagen en local (opcional)

La imagen contiene **solo el backend**; la DB se apunta por `DATABASE_URL`.
El build se hace desde la **raíz** del repo (el contexto es la raíz):

```bash
cp .env.production.example .env.render   # completá DATABASE_URL + secretos
docker build -t libredrop-api .
docker run --rm -p 8000:8000 --env-file .env.render libredrop-api

curl http://localhost:8000/health/       # {"status": "ok"}
```

(el contenedor corrió `migrate` + `collectstatic` automáticamente y levanta
Gunicorn en `$PORT`).

## 5. Operación

- **Migraciones**: `entrypoint.sh` al arrancar (+ pre-deploy si está configurado).
- **Estáticos**: `collectstatic` al arrancar; los sirve WhiteNoise.
- **Backups**: los maneja Neon (historial/restore propio).
- **Variables**: se cambian en el dashboard de Render → redeploy.
- **Imágenes de usuario**: Cloudinary las sirve con `f_auto,q_auto`
  (WebP/AVIF + calidad automática) — el backend lo hace solo desde
  `backend/backend/images.py`, sin re-subir nada.

## 6. Verificación end-to-end

1. Abrir `https://libredrop-app.vercel.app`.
2. **Crear cuenta** (`/auth/register/` crea el usuario y su tienda automática).
3. **Login** → panel de administración.
4. Editar la tienda: nombre, WhatsApp, logo (prueba Cloudinary).
5. Abrir la tienda pública en `/tienda/<slug>` y probar "Comprar por WhatsApp".

Sanity de API (sin navegador):

```bash
B=https://libredrop.onrender.com
curl $B/health/                                     # {"status": "ok"}
curl -X POST $B/auth/login/ -H "Content-Type: application/json" \
     -d '{"username":"x","password":"y"}'           # 401 (toca la DB)
curl $B/public/no-existe/                            # 404
```

## 7. Preguntas frecuentes

- **`failed to read dockerfile: open Dockerfile`**: el Dockerfile debe estar en
  la **raíz del repo** (Render lo busca ahí por defecto). En Render → Settings,
  Dockerfile Path `./Dockerfile` y Root Directory vacío.
- **Todo endpoint toca DB y da 500 / la DB tiene 0 tablas**: faltaron las
  migraciones. Si el deploy corrió antes del fix, ejecutá una vez:
  `python manage.py migrate` con el `DATABASE_URL` de Neon. Los deploys nuevos
  ya migran solos en el arranque.
- **Error de CORS**: `CORS_ALLOWED_ORIGINS` debe ser idéntico al origen de la
  app en Vercel (con `https://`, sin barra final).
- **`DisallowedHost`**: usá el `*.onrender.com` sin tocar `ALLOWED_HOST`; solo
  agregalo si usás dominio propio.
- **No conecta a Neon**: revisá `?sslmode=require` (o `DB_SSL_REQUIRE=True`) y
  que sea la cadena **pooled**. Si trae `&channel_binding=require` y falla,
  quitá ese parámetro.
- **Vercel avisa que la variable es pública**: es esperado para `VITE_API_URL`
  (la necesita el navegador). No le saques el prefijo `VITE_`.
- **Cambié `VITE_API_URL` pero la app no cambia**: redeployá en Vercel (el
  valor se hornea en el build).
- **No sube imágenes**: faltan las credenciales `CLOUDINARY_*`.
- **`PATCH` con logo da 500** (y el cloud no acumula assets): la API key de
  Cloudinary tiene rol de solo entrega. Requiere permiso de subida — en la
  consola de Cloudinary: **Settings → Access / API keys**, dar rol **Uploader**
  (permiso `create`) a la key usada. `ping` funciona aunque falle `upload`
  (`NotAllowed: missing permissions (actions=["create"])`), así que no confundas
  "la key responde" con "la key puede subir".
- **Cold starts**: el plan `free` de Render duerme; usá `starter` para producción.