# Monorepo React + Django

Este repositorio agrupa el frontend (React), el backend (Django REST Framework) y los artefactos de despliegue (Docker/Dokploy) necesarios para servir el blog de Codex.

## Estructura

- `frontend/`: aplicación React 18 con Vite. Consulta `frontend/README.md` para instrucciones específicas.
- `backend/`: proyecto Django 5 con Jazzmin y DRF. Incluye fixtures de ejemplo y configuración lista para despliegue.
- `deploy/`: Dockerfiles, entrypoints y `docker-compose` para levantar el backend junto a PostgreSQL en Dokploy u orquestadores compatibles.
- `instructions/`: guías operativas para cada módulo (frontend, backend, deploy, UX).
- `.github/workflows/deploy.yml`: pipeline que continúa publicando el frontend en GitHub Pages.

## Backend: despliegue en contenedor

El backend se ejecuta en un contenedor basado en `python:3.12-alpine` que:

1. Instala las dependencias de `backend/requirements.txt` (incluidos Gunicorn y WhiteNoise).
2. En el arranque ejecuta automáticamente:
   - `python manage.py migrate --noinput`
   - `python manage.py collectstatic --noinput`
3. Lanza Gunicorn (`backendblog.wsgi:application`) exponiendo el puerto `8000`.
4. Sirve los archivos estáticos con WhiteNoise y persiste los archivos subidos en `/app/media`.

`deploy/backend/entrypoint.sh` implementa este flujo de arranque y `deploy/backend/Dockerfile` define la imagen del servicio.

### Variables de entorno para Dokploy / producción

- `SECRET_KEY`: clave secreta de Django (obligatoria).
- `DEBUG`: `false` en producción.
- `ALLOWED_HOSTS`: dominios separados por comas (ej. `tu-dominio.com,localhost`).
- `CORS_ALLOWED_ORIGINS`: orígenes autorizados separados por comas (ej. `https://tu-frontend.com`).
- `CSRF_TRUSTED_ORIGINS`: orígenes confiables para CSRF separados por comas.
- `DATABASE_URL`: cadena completa de conexión (opcional). Si no se define, usar `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`.
- `SECURE_SSL_REDIRECT`: activa la redirección HTTPS (por defecto `true` cuando `DEBUG` es `false`).
- `GUNICORN_WORKERS`, `GUNICORN_THREADS`, `GUNICORN_TIMEOUT`: parámetros opcionales para Gunicorn.
- `DB_MAX_RETRIES`, `DB_RETRY_DELAY`: controlan el número de reintentos y la espera (en segundos) antes de lanzar error si la base de datos no está disponible.

Los archivos estáticos se generan en `/app/staticfiles` y los medios en `/app/media`. Configura un volumen persistente para `media` cuando despliegues en Dokploy.

### docker-compose de referencia

`deploy/docker-compose.yml` incluye los servicios `postgres` y `backend` con healthcheck y volumen persistente para `/app/media`. Puedes usarlo como base en Dokploy o en entornos locales de pruebas.

## Frontend: comandos principales

Desde la raíz del repositorio puedes ejecutar los comandos de Vite:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Estos scripts operan sobre `frontend/` y generan `dist/` para el despliegue en GitHub Pages.
