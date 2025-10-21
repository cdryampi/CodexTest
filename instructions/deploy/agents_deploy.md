# AGENTE DEPLOY – BACKEND DJANGO (`/deploy`)

El módulo de deploy ya incluye los artefactos necesarios para contenedizar el backend de Django y su base de datos PostgreSQL.

## Artefactos disponibles
- `deploy/backend.Dockerfile`: imagen basada en `python:3.12-alpine` que instala dependencias de sistema (para `psycopg2`), copia `backend/`, instala `requirements.txt` y arranca Gunicorn (`backendblog.wsgi:application`).
- `deploy/docker-compose.yml`: define los servicios `postgres` y `backend` preparados para Dokploy.
  - `postgres`: imagen oficial `postgres:16`, variables (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) recibidas del entorno y volumen nombrado `pgdata` para persistencia en `/var/lib/postgresql/data`. Incluye healthcheck con `pg_isready`.
  - `backend`: construye usando `deploy/backend.Dockerfile`, hereda variables (`SECRET_KEY`, `DEBUG`, `SECURE_SSL_REDIRECT`, `DATABASE_URL` o `POSTGRES_*`, `GUNICORN_WORKERS`, etc.), depende del servicio de base de datos hasta que esté `healthy`, expone el puerto interno `8000` y lo publica en el host `8001` para evitar conflictos locales (Dokploy lo publicará tras el proxy HTTPS).

## Configuración y seguridad
- `ALLOWED_HOSTS` ya considera `backendblog.yampi.eu`, `localhost` y `127.0.0.1`; se pueden añadir extras vía `ALLOWED_HOSTS`.
- HTTPS tras Dokploy: `SECURE_PROXY_SSL_HEADER` y `SECURE_SSL_REDIRECT` se controlan con la variable `SECURE_SSL_REDIRECT`.
- CORS y CSRF configurados para `https://cdryampi.github.io/CodexTest/`, `https://backendblog.yampi.eu` y `https://cdryampi.github.io`.

## Variables de entorno
Se leen con `django-environ`. Dokploy/Codex ya proveen ejemplos (`SECRET_KEY`, `DEBUG`, `SECURE_SSL_REDIRECT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) y ahora también se aceptan automáticamente las variantes `SECRET`, `URL` y cualquier clave con prefijo `DJANGO_` (por ejemplo `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_POSTGRES_HOST`). Si se expone `DATABASE_URL`, tiene prioridad sobre los campos individuales: en Dokploy asígnala directamente desde el proyecto con `DATABASE_URL=${{project.DATABASE_URL}}` (o su alias `DJANGO_DATABASE_URL`) para reutilizar la URL administrada por la plataforma. Revisa `backend/.env.example` para conocer todas las claves esperadas.

## Flujo de despliegue con Dokploy
1. Construir y publicar la imagen del backend usando `deploy/backend.Dockerfile` (Dokploy puede construirla automáticamente desde el repo o desde GHCR).
2. Desplegar el stack con `docker-compose` (Dokploy interpreta el archivo y crea los servicios `postgres` y `backend`).
3. Asegurarse de que el volumen nombrado `pgdata` se mantenga entre despliegues para conservar la base de datos.

## Checklist post-deploy
Ejecutar desde el contenedor `backend` (Dokploy permite ejecutar comandos en el servicio):
```bash
python manage.py migrate
python manage.py loaddata blog/fixtures/seed_posts.json
python manage.py createsuperuser  # opcional
```

## Pruebas y migraciones en entornos de CI/CD
- Antes de construir la imagen del backend ejecuta `python manage.py test` contra la base de datos PostgreSQL. Con Docker Compose puedes hacerlo con `docker compose run --rm backend python manage.py test` tras levantar `docker compose up -d postgres`.
- Si el repositorio introduce migraciones nuevas, añade un paso que ejecute `python manage.py migrate` usando la misma base de datos preparada para las pruebas. Esto garantiza que el esquema queda sincronizado antes de desplegar.
- Limpia los contenedores temporales de prueba (`docker compose rm -f backend`) para mantener los entornos efímeros y evitar datos residuales entre ejecuciones.

Validar después del primer despliegue:
- `/admin/` muestra el panel Jazzmin.
- `GET https://backendblog.yampi.eu/api/posts/` responde con la lista paginada.
- `GET https://backendblog.yampi.eu/api/posts/optimizacion-render-react/` entrega el detalle del post.

## Próximos pasos
- Automatizar la construcción de imágenes y publicación en GHCR.
- Añadir scripts Dokploy para ejecutar migraciones automáticamente tras cada deploy.
- Incluir monitoreo/logs centralizados y alertas.
