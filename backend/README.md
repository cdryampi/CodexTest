# BackendBlog

Backend de ejemplo en Django REST Framework para el blog de Codex.

## Requisitos previos
- Python 3.11+
- Dependencias listadas en `requirements.txt`
- PostgreSQL accesible localmente o vía Docker (opcional si se usa `DATABASE_URL`)

## Instalación local
1. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```
2. Copia `.env.example` a `.env` (sin commitear archivos `.env`) y ajusta valores según tu entorno.
3. Ejecuta las migraciones:
   ```bash
   python manage.py migrate
   ```
4. Carga los datos iniciales del blog:
   ```bash
   python manage.py loaddata blog/fixtures/seed_posts.json
   ```
5. (Opcional) crea un superusuario para acceder a `/admin/`:
   ```bash
   python manage.py createsuperuser
   ```

## Ejecución
Inicia el servidor de desarrollo en `http://127.0.0.1:8000/`:
```bash
python manage.py runserver
```

## Endpoints disponibles
- `GET /api/posts/` — listado paginado (10 por página) ordenado por fecha descendente. Admite `?search=` para filtrar por título o tags.
- `POST /api/posts/` — crea una nueva entrada (tags por nombre).
- `GET /api/posts/<slug>/` — detalle del post.
- `PUT /api/posts/<slug>/` — actualiza por completo un post existente (requiere autenticación mediante JWT).
- `PATCH /api/posts/<slug>/` — permite actualizaciones parciales del post (requiere autenticación mediante JWT).
- `DELETE /api/posts/<slug>/` — elimina un post existente (requiere autenticación mediante JWT).
- `/admin/` — panel de administración con Jazzmin.

> Nota: No crees ni commitees entornos virtuales dentro del repositorio. Si necesitas uno, créalo fuera de la carpeta del proyecto o agrega `.venv/` a tu configuración global de gitignore.
