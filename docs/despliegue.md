# Despliegue

Arquitectura de producción:

```
Navegador
   │
   ├── Frontend (React)  →  Vercel  (HTTPS gratis)
   │
   └── API (Django)      →  VPS con Docker:
                              Caddy (HTTPS automático) → Gunicorn → Postgres
```

- **Backend + base de datos**: Docker Compose en la VPS (`docker-compose.yml`).
- **Frontend**: Vercel (build estático de Vite).
- **Imágenes**: Cloudinary (ya configurado en el backend).

El backend corre con `DEBUG=False`, `SECURE_SSL_REDIRECT` y HTTPS vía Caddy
(obtiene y renueva el certificado de Let's Encrypt solo, sin certbot manual).

---

## 1. Requisitos

- Una VPS (Ubuntu/Debian) con **Docker** y **Docker Compose** instalados.
- Un **dominio** o subdominio para el API, con un registro DNS tipo **A**
  apuntando a la IP de la VPS. Ej.: `api.mitienda.com → 123.45.67.89`.
  - ¿No tenés dominio todavía? Podés usar `api.TU_IP.sslip.io`
    (ej. `api.203.0.113.10.sslip.io`); resuelve solo y sirve para probar con HTTPS.
- Cuenta de **Cloudinary** (cloud name, api key, api secret).
- Cuenta de **Vercel**.

> **Nota sobre el `.env` local**: la base de datos de Docker es **nueva y vacía**.
> Nunca reutiliza tu Postgres local ni sus datos de prueba.

---

## 2. Backend en la VPS

### 2.1 DNS
Creá el registro A `api.tudominio.com` → IP de la VPS y esperá la propagación.

### 2.2 Traer el código
```bash
git clone <tu-repo> libredrop && cd libredrop
```

### 2.3 Crear el `.env`
```bash
cp .env.docker.example .env
```

Editá `.env` y completá, como mínimo:

- `DB_PASSWORD`: una clave larga y aleatoria.
- `SECRET_KEY`: generala con
  `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`.
- `ALLOWED_HOST`: el dominio del API (+ `localhost,127.0.0.1` para el healthcheck).
- `DOMAIN`: el mismo dominio del API (Caddy lo usa para el certificado).
- `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`: el origen del frontend en
  Vercel (ej. `https://libredrop.vercel.app`). **Sin barra final.**
- `CLOUDINARY_*`.

Ejemplo:
```env
DB_NAME=libredrop
DB_USER=libredrop
DB_PASSWORD=una_clave_larga
SECRET_KEY=una_clave_de_64_chars
DEBUG=False
ALLOWED_HOST=api.mitienda.com,localhost,127.0.0.1
DOMAIN=api.mitienda.com
CORS_ALLOWED_ORIGINS=https://libredrop.vercel.app
CSRF_TRUSTED_ORIGINS=https://libredrop.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 2.4 Levantar
```bash
docker compose up -d --build
docker compose logs -f backend   # ver migraciones y arranque de Gunicorn
```

### 2.5 Verificar
```bash
curl https://api.mitienda.com/healt/     # {"status": "ok"}
```
Si el certificado todavía no está listo, mirá `docker compose logs caddy`
(puede tardar ~30 s la primera vez).

---

## 3. Frontend en Vercel

1. **Add New → Project** e importá el repositorio.
2. **Root Directory**: `frontend` (importante: el repo tiene `backend/` y `frontend/`).
3. Vercel detecta Vite solo (`npm run build`, salida `dist`).
4. En **Settings → Environment Variables** agregá:
   - `VITE_API_URL` = `https://api.mitienda.com` (sin barra final).
5. **Deploy**.

`frontend/vercel.json` ya incluye el rewrite de SPA para que funcionen las rutas
`/admin`, `/admin/catalogo` y `/tienda/<slug>` al recargar la página.

### Cerrar el círculo de CORS
Cuando Vercel te dé la URL final, confirmá que coincide con
`CORS_ALLOWED_ORIGINS`, y si cambió:
```bash
# en la VPS, editá .env y luego:
docker compose up -d
```

Si querés que también funcionen los **preview deployments** de Vercel (URLs
aleatorias), agregá en `.env`:
```env
CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.vercel\.app$
```

---

## 4. Operación

### Ver estado / logs
```bash
docker compose ps
docker compose logs -f backend
```

### Actualizar a una versión nueva
```bash
git pull
docker compose up -d --build   # re-migra y recolecta estáticos solo
```

### Backups de la base de datos
```bash
docker compose exec db pg_dump -U libredrop libredrop > backup_$(date +%F).sql
```

### Firewall
Abrí los puertos **80** y **443** en la VPS (Caddy). El 8000 no se publica
(Gunicorn solo es accesible dentro de la red de Docker).

---

## 5. Preguntas frecuentes

- **El navegador da error de CORS**: revisá que `CORS_ALLOWED_ORIGINS` sea
  idéntico al origen del frontend (protocolo + dominio, sin barra final) y corré
  `docker compose up -d`.
- **Redirecciones raras / loop HTTPS**: ya está resuelto con
  `SECURE_PROXY_SSL_HEADER` + Caddy. No cambies `SECURE_SSL_REDIRECT`.
- **No sube imágenes**: el backend necesita las credenciales `CLOUDINARY_*`.
  Un tamaño grande de imagen puede tardar; Cloudinary tiene su propio límite.
- **"DisallowedHost"**: el dominio no está en `ALLOWED_HOST`.
