# LibreDrop v1.0

## Objetivo

LibreDrop es una plataforma open source para crear tiendas online simples. La versión v1.0 (MVP) está diseñada para que emprendedores puedan crear una tienda, publicar sus productos y recibir pedidos mediante WhatsApp, eliminando la necesidad de infraestructura compleja o pasarelas de pago desde el inicio.

## Multi-tenancy

Usamos **django-tenants** para el aislamiento de datos por tienda.

## Estado actual de modelos (reset v0.1)

Este proyecto pasó por un **reset de modelos**. La base mínima actual es:

```
accounts
└── User (AbstractUser)

tenants
├── Tenant   (TenantMixin, name + auto_create_schema)
├── Domain   (DomainMixin)
└── Membership (User ↔ Tenant, role)
```

`stores`, `catalog`, `customers` y `orders` están registradas como apps tenant pero **sin modelos propios** todavía. Se construirán después, de a uno.
