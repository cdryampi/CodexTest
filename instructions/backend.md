# Backend – Semillas de datos

La API de Django incorpora comandos de gestión para generar datos masivos de pruebas sin duplicar contenido existente. Todos los comandos viven en `blog.management.commands`.

## Requisitos previos

1. Instala dependencias con `pip install -r backend/requirements.txt` (incluye Faker >= 20).
2. Configura el entorno (`backend/.env`) asegurando que `DJANGO_DEBUG=true` o exporta `ALLOW_SEED=true` para permitir las semillas.
3. Ejecuta las migraciones antes de sembrar: `python manage.py migrate`.

## Comandos disponibles

### `python manage.py seed_users`

- Genera usuarios normales (sin permisos de staff/superuser).
- Argumentos opcionales:
  - `--count`: cantidad de usuarios a crear (por defecto 40).
  - `--domain`: dominio para los correos (por defecto `example.com`).
- Contraseña de prueba: `password123`.
- Idempotente: si el `username` ya existe, se omite.

### `python manage.py seed_posts`

- Crea entradas de blog con contenido extenso, imágenes de `picsum.photos` y 2–5 tags aleatorios.
- Argumentos opcionales:
  - `--count`: número de posts a generar (por defecto 300).
- Idempotente por título y slug (se añade sufijo incremental si choca el slug).

### `python manage.py seed_comments`

- Inserta comentarios ficticios para cada post.
- Argumentos opcionales:
  - `--per-post-min`: mínimo de comentarios por post (por defecto 3).
  - `--per-post-max`: máximo de comentarios por post (por defecto 12).
- Se evita la duplicación básica mediante una firma `(post_id, autor, snippet)` almacenada en memoria.

### `python manage.py seed_all`

- Ejecuta los tres comandos anteriores en orden.
- Argumentos útiles:
  - `--fast`: tamaños reducidos (12 usuarios, 40 posts, 1–3 comentarios por post).
  - `--users`, `--posts`, `--comments`: sobrescriben las cantidades por defecto.
  - `--reset`: elimina posts, tags y comentarios antes de sembrar (requiere `ALLOW_SEED_RESET=true`).
  - `--domain`: dominio de correo para los usuarios.
- Al finalizar muestra un resumen con elementos nuevos y omitidos.

## Guardas de entorno

- Las semillas solo se ejecutan si `settings.DEBUG` es `True` **o** `ALLOW_SEED=true`.
- `SEED_ON_MIGRATE=true` habilita la ejecución automática de `seed_all` tras `migrate` (respeta las guardas anteriores).
- `ALLOW_SEED_RESET=true` permite usar `--reset` en `seed_all`.

## Ejemplos de uso

```bash
# Dataset completo en local (requiere DEBUG o ALLOW_SEED=true)
cd backend
python manage.py migrate
python manage.py seed_all

# Dataset rápido para demos
python manage.py seed_all --fast

# Solo posts específicos
python manage.py seed_posts --count 120
```

## Buenas prácticas

- No actives `SEED_ON_MIGRATE` en producción real; úsalo solo en entornos de desarrollo, staging o demos efímeras.
- Ejecutar dos veces cualquier comando no debe duplicar títulos, usuarios ni multiplicar comentarios de manera descontrolada.
- Ajusta los tamaños mediante flags en vez de editar `seed_config.py` salvo que quieras cambiar los valores por defecto de forma permanente.
