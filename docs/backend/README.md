# Backend – Documentación

> Consulta también la guía operativa para agentes en `../../instructions/backend/agents_backend.md` y las tareas activas en `../../instructions/backend.md` antes de realizar cambios relevantes.

## Tabla de contenidos
- [Resumen](#resumen)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
  - [Archivos estáticos](#archivos-estáticos)
  - [Archivos multimedia](#archivos-multimedia)
  - [CORS y CSRF](#cors-y-csrf)
- [Base de datos](#base-de-datos)
- [Comandos operativos](#comandos-operativos)
- [API (referencia)](#api-referencia)
  - [Documentación interactiva](#documentación-interactiva)
  - [Posts](#posts)
  - [Comentarios](#comentarios)
  - [Paginación, filtros y ordenación](#paginación-filtros-y-ordenación)
  - [Formato de errores](#formato-de-errores)
- [Seeds](#seeds)
- [Deploy](#deploy)
- [CI/CD y pruebas](#cicd-y-pruebas)
- [Troubleshooting](#troubleshooting)
- [Versionado y cambios](#versionado-y-cambios)
- [Glosario](#glosario)

## Resumen
El backend del proyecto CodexTest es un servicio web construido con **Django 5**, **Django REST Framework (DRF)**, **WhiteNoise** y **Gunicorn**. Provee la API pública que consume el frontend React (`/frontend`) y sirve como origen de datos para entradas de blog y sus comentarios. Se entrega como una aplicación WSGI empacada en contenedores que Dokploy orquesta junto con la capa de despliegue descrita en `../../deploy`.

## Arquitectura
```
[Cliente HTTP]
    │
    ├─▶ /api/ (DRF + viewsets en `backend/blog/views.py`)
    │      ├─ posts (CRUD parcial)
    │      └─ comments (nested)
    │
    ├─▶ /api/docs|/api/redoc|/api/schema (drf-spectacular)
    │
    ├─▶ Seeds (`manage.py seed_*`, configuración en `backend/blog/seed_config.py`)
    │
    ├─▶ Archivos estáticos (`/static/` + WhiteNoise → `STATIC_ROOT=/backend/staticfiles`)
    │
    ├─▶ Archivos multimedia (`/media/` → volumen Dokploy opcional)
    │
    ├─▶ Entrypoint Docker (`deploy/backend/entrypoint.sh` → migrate → collectstatic → Gunicorn)
    │
    └─▶ Gunicorn (`backendblog.wsgi`) detrás de Dokploy / proxy HTTP
```
Rutas clave del repositorio:
- `/backend/`: proyecto Django.
  - `backendblog/`: configuración (`settings.py`, `urls.py`, `wsgi.py`).
  - `blog/`: app principal con modelos (`models.py`), serializadores, vistas y seeds.
- `deploy/backend/entrypoint.sh`: script de arranque usado en contenedores Dokploy.
- `instructions/backend/agents_backend.md`: lineamientos de colaboración.

## Requisitos
- **Python 3.12**.
- Dependencias listadas en `backend/requirements.txt` (Django 5, djangorestframework, django-filter, drf-spectacular, whitenoise, gunicorn, jazzmin, faker, psycopg[binary], etc.).

Variables de entorno mínimas (puedes usar los nombres estándar o las variantes `SECRET`/`URL` y prefijos `DJANGO_` que espera Dokploy):

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `SECRET_KEY` (`SECRET`, `DJANGO_SECRET_KEY`) | Clave criptográfica de Django. | `django-insecure-...` |
| `DEBUG` (`DJANGO_DEBUG`) | Activa modo debug (solo en desarrollo). | `true` |
| `ALLOWED_HOSTS` (`DJANGO_ALLOWED_HOSTS`) | Lista CSV de hosts adicionales. | `backend.local,api.example.com` |
| `CORS_ALLOWED_ORIGINS` (`DJANGO_CORS_ALLOWED_ORIGINS`) | Orígenes permitidos (admite rutas específicas). | `https://cdryampi.github.io/CodexTest/` |
| `CSRF_TRUSTED_ORIGINS` (`DJANGO_CSRF_TRUSTED_ORIGINS`) | Orígenes confiables para CSRF. | `https://backendblog.yampi.eu` |
| `DATABASE_URL` (`URL`, `DJANGO_DATABASE_URL`) | URL Postgres (se prioriza sobre variables `POSTGRES_*`). | `postgres://user:pass@db:5432/blog` |
| `POSTGRES_*` (`DJANGO_POSTGRES_*`) | Parámetros individuales si no hay `DATABASE_URL`. | `POSTGRES_DB=blog` |
| `GUNICORN_WORKERS` | Número de workers en producción. | `4` |
| `GUNICORN_THREADS` | Hilos por worker. | `2` |
| `GUNICORN_TIMEOUT` | Timeout en segundos. | `120` |
| `ALLOW_SEED`, `ALLOW_SEED_RESET`, `SEED_ON_MIGRATE` | Flags para seeds (ver [Seeds](#seeds)). | `true/false` |
| `DB_MAX_RETRIES`, `DB_RETRY_DELAY` | Retries de conexión en entrypoint. | `30`, `1` |

## Configuración
Configuración relevante extraída de `backend/backendblog/settings.py`:

```python
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "blog.pagination.DefaultPageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}
```

### Archivos estáticos
- `STATIC_URL=/static/` y `STATIC_ROOT=/backend/staticfiles`.
- WhiteNoise (`whitenoise.storage.CompressedManifestStaticFilesStorage`) sirve los assets en contenedores sin necesidad de Nginx intermedio.
- Ejecutar `python manage.py collectstatic --noinput` antes de levantar Gunicorn (automatizado en el entrypoint).

### Archivos multimedia
- `MEDIA_URL=/media/` y `MEDIA_ROOT=/backend/media`.
- En desarrollo, sirven vía `DEBUG=True` y `django.conf.urls.static`. En producción, Dokploy debe montar un volumen persistente y exponerlo vía proxy inverso.

### CORS y CSRF
- `CORS_ALLOWED_ORIGINS` admite rutas con sufijos; el ajuste corta la ruta para la whitelist y añade una regex que respeta la ruta completa.
- `CSRF_TRUSTED_ORIGINS` debe incluir los orígenes HTTPS utilizados por el frontend o el panel de administración.
- Ajusta estas variables por entorno para evitar errores 403/CSRF.

## Base de datos
- Desarrollo rápido: usar SQLite ejecutando `DATABASE_URL=sqlite:///db.sqlite3` (no se versiona; útil en sesiones locales).
- CI/Producción: Postgres vía `DATABASE_URL` o los parámetros `POSTGRES_*`.
- El entrypoint (`deploy/backend/entrypoint.sh`) incluye un loop de espera configurable mediante `DB_MAX_RETRIES` y `DB_RETRY_DELAY` para garantizar disponibilidad antes de migrar.

## Comandos operativos
Ejecutar siempre desde `/backend` con el entorno activado.

```bash
# Migraciones
env DJANGO_SETTINGS_MODULE=backendblog.settings python manage.py migrate --noinput

# Recolección de estáticos
env DJANGO_SETTINGS_MODULE=backendblog.settings python manage.py collectstatic --noinput

# Superusuario para CI / demo
env DJANGO_SETTINGS_MODULE=backendblog.settings DJANGO_SUPERUSER_USERNAME=ci-admin \
    DJANGO_SUPERUSER_EMAIL=ci@example.com DJANGO_SUPERUSER_PASSWORD=ci-pass \
    python manage.py createsuperuser --noinput

# Seeds (ver sección dedicada)
ALLOW_SEED=true python manage.py seed_all --fast
```

## API (referencia)
Todas las rutas están bajo `/api/` según `backend/backendblog/urls.py`.

### Documentación interactiva
- Swagger UI: `GET /api/docs/`
- Redoc: `GET /api/redoc/`
- Esquema JSON: `GET /api/schema/`

### Posts
- **Listar** `GET /api/posts/?page=&page_size=&search=&ordering=&tags=&category=`
  - Parámetros:
    - `page` / `page_size`: paginación numérica (máx. `page_size=50`).
    - `search`: busca en `title`, `content` y nombres de tags.
    - `ordering`: `created_at` (`date`), `-created_at`, `title`, `-title`.
    - `tags`: múltiple usando `?tags=python&tags=django` (usa `tags__name`).
    - `category`: slug único que filtra por la categoría asociada al post.
  - Respuesta (extracto):

```json
{
  "count": 120,
  "next": "http://127.0.0.1:8000/api/posts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Optimiza el renderizado en React",
      "slug": "optimiza-el-renderizado-en-react",
      "excerpt": "Resumen del artículo...",
      "tags": ["react", "tutorial"],
      "categories": ["frontend", "rendimiento"],
      "categories_detail": [
        { "slug": "frontend", "name": "Frontend", "description": "UI y diseño" },
        { "slug": "rendimiento", "name": "Rendimiento", "description": "Perf tuning" }
      ],
      "created_at": "2024-02-12",
      "image": "https://picsum.photos/seed/react/1200/800"
    }
  ]
}
```

- **Detalle** `GET /api/posts/{slug}/`
- **Crear** `POST /api/posts/` (permiso actual `AllowAny`; pendiente endurecer). Cuerpo esperado:
- **Actualizar** `PUT /api/posts/{slug}/` (requiere autenticación JWT). Acepta el mismo payload que la creación y reemplaza por completo el recurso.
- **Actualizar parcialmente** `PATCH /api/posts/{slug}/` (requiere autenticación JWT). Permite enviar solo los campos a modificar.
- **Eliminar** `DELETE /api/posts/{slug}/` (requiere autenticación JWT).

```json
{
  "title": "Novedades en Django 5",
  "excerpt": "Resumen de las nuevas características...",
  "content": "El contenido debe tener al menos 20 caracteres...",
  "tags": ["django", "devops"],
  "categories": ["backend", "productividad"],
  "date": "2024-03-15",
  "author": "Equipo CodexTest"
}
```

Validaciones clave:
- `title` ≥ 5 caracteres.
- `content` ≥ 20 caracteres.
- Los tags inexistentes se crean automáticamente.
- Las categorías se envían por `slug`; si no existen se ignoran y se conserva la integridad de la relación.

### Comentarios
- **Listar** `GET /api/posts/{slug}/comments/`
- **Crear** `POST /api/posts/{slug}/comments/`
  - Payload mínimo:

```json
{
  "author_name": "Ana",
  "content": "Gran post, gracias por compartir!"
}
```

- Comentarios se ordenan por `created_at` descendente.
- Validaciones: `author_name` no vacío, `content` ≥ 5 caracteres.

### Categorías
- **Listar** `GET /api/categories/?q=&is_active=&with_counts=`
  - `q`: búsqueda textual en nombre o descripción (case-insensitive).
  - `is_active`: admite `true/false`, `1/0` o `yes/no` para limitar por estado.
  - `with_counts`: cuando es verdadero (`true`, `1`, `yes`) añade `post_count` con el total de posts asociados.
- **Detalle** `GET /api/categories/{slug}/`
- **Crear/Actualizar** `POST|PUT|PATCH /api/categories/` (requiere autenticación). Los slugs se generan automáticamente y se validan para evitar duplicados.

### Paginación, filtros y ordenación
- Paginación: `PageNumberPagination` personalizada (`blog/pagination.py`) con `page`, `page_size` y límite de 50.
- Filtros: `django-filter` permite `?tags=python` (se puede repetir el parámetro para múltiples tags) y `?category=frontend` para restringir por slug de categoría.
- Ordenación: `?ordering=created_at` o `?ordering=-title`.

Consulta de ejemplo con `curl` y `jq`:
```bash
curl -sS http://127.0.0.1:8000/api/posts/?search=django\&ordering=-created_at | jq
```

Creación de comentario desde consola:
```bash
curl -sS -X POST http://127.0.0.1:8000/api/posts/mi-slug/comments/ \
  -H 'Content-Type: application/json' \
  -d '{"author_name":"Ana","content":"Gran post"}'
```

### Formato de errores
DRF devuelve errores JSON estructurados. Ejemplos reales:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"content": ["El comentario debe tener al menos 5 caracteres."]}
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"detail": "No encontrado."}
```

## Seeds
Comandos disponibles (`backend/blog/management/commands`):
- `seed_users` genera usuarios de prueba; evita duplicados por `username`/`email`.
- `seed_posts` crea entradas con slugs únicos y asigna tags (creados si faltan).
- `seed_comments` añade comentarios únicos usando firmas `(post_id, author, contenido)`.
- `seed_all` orquesta las anteriores, permite `--fast` (12 usuarios, 40 posts, 1-3 comentarios) y `--reset` (requiere `ALLOW_SEED_RESET=true`).

Características:
- Idempotencia: cada comando verifica existencia antes de crear (slugs/títulos en posts, firmas en comentarios, `get_or_create` en usuarios y tags).
- Flags de entorno:
  - `ALLOW_SEED=true` o `DEBUG=true` habilitan seeds en entornos dinámicos.
  - `ALLOW_SEED_RESET=true` permite el borrado previo de datos al usar `seed_all --reset`.
  - `SEED_ON_MIGRATE=true` ejecuta seeds al aplicar migraciones (solo en entornos efímeros; evita producción).
  - `STATIC_SEED_MODE=true` (por defecto) habilita modo determinista para fixtures reproducibles.

## Deploy
- Entrypoint (`deploy/backend/entrypoint.sh`):
  1. Crea directorios `staticfiles` y `media`.
  2. Espera a la base de datos (retry configurable).
  3. Ejecuta `migrate --noinput` y `collectstatic --noinput`.
  4. Arranca Gunicorn con variables `GUNICORN_*`.
- En producción, Dokploy debe:
  - Montar volúmenes persistentes para `/app/staticfiles` (opcional) y `/app/media`.
  - Configurar healthchecks (`/admin/login/` o `/api/`) después de cada despliegue.
  - Redeploy obligatorio tras cambiar variables de entorno.

## CI/CD y pruebas
- Job `agents_backend_test` (definido en `../../instructions/backend/agents_backend_tests.md`):
  1. Provisiona Postgres efímero.
  2. Ejecuta migraciones y `collectstatic`.
  3. Opcionalmente corre `python manage.py seed_all --fast` si `ALLOW_SEED=true`.
  4. Smoke tests: status 200 en `/admin/login/`, `/static/admin/css/base.css`, `/api/`.
  5. Lanza `python manage.py test`.
  6. Publica artefactos y limpia recursos.
- Este job es gate obligatorio antes de merge o despliegue Dokploy.
- Nota: se retiraron las pruebas del endpoint de traducciones con OpenAI porque GitHub Actions no puede realizar llamadas reales al servicio y las ejecuciones fallaban de forma intermitente. Valida la integración manualmente en entornos locales con credenciales válidas cuando sea necesario.

## Troubleshooting
- **Panel /admin sin CSS**: falta `collectstatic` o configuración de WhiteNoise; reejecuta el comando y verifica permisos de `staticfiles`.
- **400 Bad Request en producción**: revisa `ALLOWED_HOSTS` y `CSRF_TRUSTED_ORIGINS`.
- **500 durante migrate**: la base de datos no está disponible; ajusta `DB_MAX_RETRIES` o añade espera previa.
- **404 en /api/docs/**: confirma que `drf-spectacular` sigue en `INSTALLED_APPS` y que `backendblog/urls.py` incluye `SpectacularAPIView`.

## Versionado y cambios
- La API sigue **SemVer** simple (`MAJOR.MINOR.PATCH`) definida en `SPECTACULAR_SETTINGS["VERSION"]`.
- Documenta breaking changes incrementando la versión mayor y registrándolas en este archivo.
- Mantén changelog en `docs/backend/README.md` o crea una subsección nueva si se planifican releases.

## Glosario
- **DRF**: Django REST Framework, toolkit para construir APIs REST en Django.
- **ViewSet**: Clase DRF que combina acciones (list, retrieve, create) en un único recurso.
- **Router**: Registrador automático de rutas para viewsets.
- **WhiteNoise**: Middleware que sirve archivos estáticos directamente desde Django.
- **Seed**: Script que genera datos de ejemplo o iniciales.
- **CI/CD**: Integración y entrega continuas.
- **Dokploy**: Plataforma utilizada para desplegar los contenedores del backend.
