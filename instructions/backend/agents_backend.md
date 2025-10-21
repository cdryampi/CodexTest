# AGENTE BACKEND – API DJANGO (`/backend`)

El backend del blog ya está operativo con Django REST Framework y Jazzmin.

## Estructura
- Proyecto: `backendblog` (settings, URLs y configuración global).
- App principal: `blog` (modelos `Post` y `Tag`, serializers, vistas DRF y fixtures iniciales).
- Fixtures: `blog/fixtures/seed_posts.json` con el post "Optimiza el renderizado en React" y sus tags.

## Configuración clave (`settings.py`)
- Variables cargadas con `django-environ`:
  - `SECRET_KEY` (clave de Django).
  - `DEBUG` (por defecto `False`).
  - `ALLOWED_HOSTS` (complementa a `backendblog.yampi.eu`, `localhost`, `127.0.0.1`).
  - `SECURE_SSL_REDIRECT` (por defecto `not DEBUG`).
  - `CSRF_TRUSTED_ORIGINS` y `CORS_ALLOWED_ORIGINS`.
  - `DATABASE_URL` (en Dokploy configúrala como `DATABASE_URL=${{project.POSTGRES_URL}}`) o, en su defecto, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`.
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

## Pruebas automatizadas
- Las pruebas viven en `blog/tests.py` y cubren el listado de posts y la creación de tags bajo demanda.
- Ejecútalas con `python manage.py test` desde la carpeta `/backend`.
- Antes de lanzarlas asegúrate de que la base de datos PostgreSQL está operativa. Si trabajas con Docker utiliza `docker compose up -d postgres` desde `/deploy` y luego `docker compose run --rm backend python manage.py test`.
- Cuando modifiques modelos o migraciones, corre `python manage.py migrate` contra la base de datos en marcha para alinear el esquema previo a las pruebas.

## Agente de pruebas backend
Se creó un agente específico en `instructions/backend/agents_backend_tests.md` para profundizar en la estrategia de testing automatizado.

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
Consulta `backend/.env.example` para ver todas las claves requeridas/optativas (`SECRET_KEY`, `DEBUG`, `SECURE_SSL_REDIRECT`, `DATABASE_URL`, `POSTGRES_*`, `GUNICORN_WORKERS`, etc.).

## Futuras tareas sugeridas
- Autenticación y permisos (tokens o sesiones) para proteger endpoints de escritura.
- Comentarios y relación con usuarios.
- Rate limiting / throttling.
- Pruebas automatizadas (unitarias e integración).
- Documentación OpenAPI/Swagger.
- Automatizar despliegue continuo (CI/CD) y monitorización.
