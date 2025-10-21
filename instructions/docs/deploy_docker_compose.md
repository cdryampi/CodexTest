# Despliegue – Docker Compose

Este documento explica cómo utilizar los artefactos reales contenidos en `/deploy` para levantar la aplicación mediante Docker Compose (v1 y v2) y cómo adaptarlos a diferentes entornos.

## Servicios existentes

El archivo [`/deploy/docker-compose.yml`](../../deploy/docker-compose.yml) define tres servicios principales:

- **postgres**
  - Imagen `postgres:16`.
  - Lee credenciales desde `.env` (variables `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).
  - Persiste datos en el volumen nombrado `pgdata_v3`.
  - Healthcheck: `pg_isready` contra `127.0.0.1:5432` cada 10 s.
- **backend**
  - Construido con `deploy/backend.Dockerfile`.
  - Expone `8000` internamente y se publica en el host como `8001`.
  - Monta el volumen `backend_media` en `/app/media` para persistir archivos subidos.
  - Utiliza `env_file: .env` y variables adicionales (`POSTGRES_HOST`, `GUNICORN_*`, `DB_MAX_RETRIES`, etc.).
  - Healthcheck: `curl -fsS http://localhost:8000/admin/login/`.
  - Depende de `postgres` hasta que el healthcheck sea exitoso.

## Levantar entorno local

1. Copia la plantilla de variables:
   ```bash
   cp deploy/templates/.env.sample .env
   ```
   Ajusta claves y dominios según tu caso.
2. Construye y levanta los servicios:
   ```bash
   docker compose -f deploy/docker-compose.yml up -d --build
   # o con Docker Compose v1
   docker-compose -f deploy/docker-compose.yml up -d --build
   ```
3. Verifica los logs:
   ```bash
   docker compose -f deploy/docker-compose.yml logs -f backend
   ```
4. Ejecuta migraciones manuales si necesitas pasos adicionales:
   ```bash
   docker compose -f deploy/docker-compose.yml exec backend python manage.py migrate
   docker compose -f deploy/docker-compose.yml exec backend python manage.py createsuperuser
   ```
5. Accede a `http://localhost:8001/admin/` para validar el despliegue.

## `docker-compose.override.yml` para desarrollo

Crea un archivo `docker-compose.override.yml` en la raíz del repo (o reutiliza la plantilla de `/deploy/templates/docker-compose.yml.template`) con ajustes como:

```yaml
services:
  backend:
    volumes:
      - ./backend:/app
      - ./deploy/backend/entrypoint.sh:/entrypoint.sh:ro
    environment:
      DEBUG: "1"
      SEED_ON_STARTUP: "1"
    command: ["python", "manage.py", "runserver", "0.0.0.0:8000"]
  postgres:
    ports:
      - "5432:5432"
```

Con este archivo, `docker compose up` habilitará recarga en caliente del backend y expondrá PostgreSQL a herramientas locales.

## Alternativa con SQLite

Para prototipos sin PostgreSQL:

1. Define `DATABASE_URL=sqlite:///db.sqlite3` en `.env`.
2. Añade al override:
   ```yaml
   services:
     backend:
       environment:
         DATABASE_URL: "sqlite:////app/db.sqlite3"
   ```
3. Omite el servicio `postgres` (puedes comentarlo o dejarlo detenido).
4. Asegúrate de mapear un volumen para el archivo SQLite si requieres persistencia:
   ```yaml
   services:
     backend:
       volumes:
         - sqlite_data:/app
   volumes:
     sqlite_data:
   ```

## Migraciones y estáticos

El entrypoint de backend ya ejecuta:

1. Espera activa a la base de datos (`DB_MAX_RETRIES`, `DB_RETRY_DELAY`).
2. `python manage.py migrate --noinput`.
3. `collectstatic --noinput`.
4. `seed_categories` cuando `SEED_ON_STARTUP=1`.

Puedes lanzar manualmente `python manage.py collectstatic` o `seed_all` usando `docker compose exec backend ...` cuando necesites refrescar contenido.

## CORS y CSRF

- Configura `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` en `.env` con la URL real del frontend.
- Para despliegues detrás de Nginx/Dokploy, incluye el dominio público (`https://app.example.com`) y las variantes internas si corresponde.

## Estáticos y media

- WhiteNoise sirve archivos estáticos desde `/app/staticfiles` dentro del contenedor.
- Los archivos de usuario (media) viven en el volumen `backend_media`. Asegura backups periódicos en producción.

## Comandos útiles

```bash
# Listar contenedores y estado
docker compose -f deploy/docker-compose.yml ps

# Inspeccionar healthchecks
docker inspect <container_id> --format '{{json .State.Health}}' | jq

# Limpiar volúmenes (¡destructivo!)
docker volume rm pgdata_v3 backend_media
```

Usa esta guía como contrato de referencia cuando copies la infraestructura a nuevos repositorios.
