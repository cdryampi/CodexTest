# Guía de despliegue del proyecto

Este directorio contiene los artefactos oficiales para levantar el backend Django con PostgreSQL utilizando Docker Compose y prepararlo para Dokploy/GHCR.

## Estructura actual

```
/deploy
├── backend.Dockerfile       # Imagen backend Django + Gunicorn
├── backend/entrypoint.sh    # Espera DB, migraciones, collectstatic
├── docker-compose.yml       # Compose base (backend + postgres)
├── nginx.conf               # Referencia para proxy/SPA
└── templates/               # Plantillas reutilizables (compose, Dockerfiles, Dokploy, CI, env)
```

## Requisitos

- Docker >= 24 con soporte para `docker compose` v2 (o `docker-compose` v1).
- Archivo `.env` basado en `deploy/templates/.env.sample` ubicado en la raíz del repo o junto a `docker-compose.yml`.

## Levantar entorno local

```bash
# 1. Copiar variables
cp deploy/templates/.env.sample .env

# 2. Construir y levantar
docker compose -f deploy/docker-compose.yml up -d --build

# 3. Revisar logs
docker compose -f deploy/docker-compose.yml logs -f backend
```

Comandos adicionales:

```bash
# Aplicar migraciones manuales
docker compose -f deploy/docker-compose.yml exec backend python manage.py migrate

# Crear superusuario
docker compose -f deploy/docker-compose.yml exec backend python manage.py createsuperuser

# Ejecutar seeds de demo (categorías)
docker compose -f deploy/docker-compose.yml exec backend python manage.py seed_categories
```

Accede a `http://localhost:8001/admin/` para validar que Gunicorn y migraciones respondan correctamente.

## Build de imágenes para producción

```bash
# Backend
docker build -f deploy/backend.Dockerfile -t ghcr.io/<usuario>/<repo>-backend:local .

# Frontend (usa la plantilla si aún no existe Dockerfile real)
docker build -f deploy/templates/Dockerfile.frontend.template -t ghcr.io/<usuario>/<repo>-frontend:local .
```

Publica las imágenes en GHCR:

```bash
docker login ghcr.io

docker push ghcr.io/<usuario>/<repo>-backend:local
docker push ghcr.io/<usuario>/<repo>-frontend:local
```

## Integración con Dokploy

1. Crea el proyecto en Dokploy (`codextest-blog` o equivalente).
2. Añade servicios `backend` y `frontend` apuntando a las imágenes `ghcr.io/<usuario>/<repo>-backend:<tag>` y `ghcr.io/<usuario>/<repo>-frontend:<tag>`.
3. Sube las variables de entorno usando la plantilla `.env`.
4. Declara un volumen persistente para `/app/media` en el backend.
5. Configura dominios (ej. `api.example.com`, `app.example.com`) y habilita Let's Encrypt.
6. Opcional: usa `deploy/templates/dokploy.example.yaml` como base para importar la configuración.

## Puertos y volúmenes

| Servicio  | Puerto contenedor | Puerto host (local) | Volúmenes |
| --------- | ----------------- | ------------------- | --------- |
| backend   | 8000              | 8001 (`ports` en compose) | `backend_media` → `/app/media` |
| postgres  | 5432              | sin exponer (puede habilitarse en override) | `pgdata_v3` → `/var/lib/postgresql/data` |

## Logs

- Local: `docker compose -f deploy/docker-compose.yml logs -f <servicio>`.
- Dokploy: pestaña *Logs* o `dokploy-cli logs backend`.

## Diferencias Dev vs Prod

| Aspecto | Desarrollo | Producción |
| ------- | ---------- | ---------- |
| DB | PostgreSQL en contenedor (o SQLite) | PostgreSQL administrado / volumen persistente |
| Seeds | `SEED_ON_STARTUP=1` opcional | `SEED_ON_STARTUP=0` (semillas manuales) |
| DEBUG | `1` o `true` para inspección | `0`, activar `ALLOWED_HOSTS` y `CSRF_TRUSTED_ORIGINS` |
| Dominio | `localhost:8001` | `https://api.example.com` a través de Dokploy |
| SSL | No (solo HTTP) | Let's Encrypt gestionado por Dokploy |
| Logs | `docker compose logs` | `dokploy-cli logs`, integración con observabilidad |

Mantén esta guía sincronizada con las plantillas de `/deploy/templates` y la documentación en `/instructions/docs` para asegurar despliegues reproducibles.
