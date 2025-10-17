# AGENTE BACKEND – API DJANGO (`/backend`)

El backend del blog ya está operativo con Django REST Framework y Jazzmin.

## Estructura
- Proyecto: `backendblog` (settings, URLs y configuración global).
- App principal: `blog` (modelos `Post` y `Tag`, serializers, vistas DRF y fixtures iniciales).
- Fixtures: `blog/fixtures/seed_posts.json` con el post "Optimiza el renderizado en React" y sus tags.

## Configuración clave (`settings.py`)
- Variables cargadas con `python-decouple`:
  - `SECRET` → `SECRET_KEY`.
  - `DJANGO_DEBUG` (por defecto `False`).
  - `DJANGO_ALLOWED_HOSTS` (complementa a `backendblog.yampi.eu`, `localhost`, `127.0.0.1`).
  - `DJANGO_SECURE_SSL_REDIRECT` (por defecto `not DEBUG`).
  - `DJANGO_CSRF_TRUSTED_ORIGINS` y `DJANGO_CORS_ALLOWED_ORIGINS`.
  - `DATABASE_URL` o, en su defecto, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`.
- CORS restringido al origen `https://cdryampi.github.io/CodexTest/` (se acepta la ruta vía regex) y CSRF confiado a `https://backendblog.yampi.eu` y `https://cdryampi.github.io`.
- Jazzmin activo con branding "BackendBlog".
- `REST_FRAMEWORK` configurado con paginación de 10 elementos y ordenación por `-date`.

## Modelos y admin
- `Tag (name único)` y `Post` con slug autogenerado, campos de contenido completos y relación `ManyToMany` hacia `Tag`.
- Admin Jazzmin listo con filtros por fecha y tags, búsqueda por título/contenido y autocompletado del slug.

## API disponible
- `GET /api/posts/`: listado paginado y ordenado por fecha descendente. `?search=` filtra por título o tags (búsqueda `icontains`).
- `POST /api/posts/`: crea un post permitiendo pasar tags por nombre (se crean si no existen).
- `GET /api/posts/<slug>/`: detalle por slug.

## Puesta en marcha local
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # ajusta valores
python manage.py migrate
python manage.py loaddata blog/fixtures/seed_posts.json
python manage.py createsuperuser  # opcional para /admin/
python manage.py runserver
```

## Variables de entorno documentadas
Consulta `backend/.env.example` para ver todas las claves requeridas/optativas (`SECRET`, `DJANGO_DEBUG`, `DJANGO_SECURE_SSL_REDIRECT`, `DATABASE_URL`, `POSTGRES_*`, `GUNICORN_WORKERS`, etc.).

## Futuras tareas sugeridas
- Autenticación y permisos (tokens o sesiones) para proteger endpoints de escritura.
- Comentarios y relación con usuarios.
- Rate limiting / throttling.
- Pruebas automatizadas (unitarias e integración).
- Documentación OpenAPI/Swagger.
- Automatizar despliegue continuo (CI/CD) y monitorización.
