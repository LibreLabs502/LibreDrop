# LibreDrop

Plataforma multitenant para catálogos de tiendas públicas con pedidos y consultas por WhatsApp, Instagram, Facebook y TikTok.

## Stack

- **Backend**: Django 6.1 + DRF + SimpleJWT + Postgres + Cloudinary (imágenes)
- **Frontend**: React 18 + Vite + React Router

## Funciones principales

- Catálogos por tienda con categorías normales y de temporada, productos
  destacados y hasta cinco fotos por producto.
- Registro guiado en tres pasos para crear la cuenta, con una bienvenida en el
  acceso y transiciones al entrar al panel y al confirmar la activación.
- Ofertas con precio normal y porcentaje de descuento; el precio rebajado se
  calcula automáticamente. La oferta puede tener fecha de vencimiento y la
  tienda muestra una cuenta regresiva mientras está activa.
- Tienda pública con portada de marca, un carrusel principal priorizado por
  temporada, ofertas y destacados, y filas desplazables para las colecciones
  restantes. Incluye navegación adaptable, búsqueda y filtros de productos.
- Carrito local por tienda y checkout público para registrar pedidos con datos
  del cliente, artículos, cantidades y notas; después se continúa por los
  canales configurados por la tienda.
- Panel de pedidos con filtros por estado, detalle desplegable y actualización
  del estado del pedido.
- Acuerdo de uso y tratamiento de datos con aceptación registrada por cuenta,
  y una transición de marca al enviar comprobantes de suscripción.
- El código está licenciado bajo GNU AGPL-3.0; la suscripción del servicio
  oficial cubre alojamiento, soporte y actualizaciones. Las mejoras aceptadas
  para el producto oficial se comparten con todas las tiendas.
- `robots.txt` pide a todos los rastreadores que no recorran el sitio; no es una
  barrera de seguridad ni puede controlar los bots que ignoren la instrucción.
- Al elegir **Temporada**, aparecen sus subcategorías debajo del buscador para
  filtrar los productos por ocasión.
- Las compras se informan por los canales configurados por cada tienda.
  Productos, carrito y pedidos se adaptan a pantallas móviles y a la paleta de
  cada tienda.

## Estructura

```
backend/    API Django (accounts, tenants, catalog, customers, orders, storefront, payments)
frontend/   SPA React (admin + tienda pública)
docs/       Documentación
```

## Inicio rápido

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# crear backend/.env con SECRET_KEY, DB_*, CLOUDINARY_* (ver docs/instalacion.md)
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev   # http://127.0.0.1:5173, proxy /api → :8000
```

API docs (Swagger): `http://localhost:8000/docs/`

## Producción (live)

- **API**: https://libredrop.onrender.com — Docker en Render + Postgres en Neon (`DATABASE_URL`), migraciones automáticas en cada deploy.
- **App**: https://libredrop-cloud.vercel.app — SPA React; `VITE_API_URL` apunta al backend.

> Detalle paso a paso en [docs/despliegue.md](docs/despliegue.md).

## Documentación

- [Instalación y configuración](docs/instalacion.md)
- [Despliegue (Render + Neon + Vercel)](docs/despliegue.md)
- [API / Endpoints](docs/api.md)
- [Arquitectura y multitenancy](docs/arquitectura.md)
- [Historial de versiones](VERSIONS.md)
