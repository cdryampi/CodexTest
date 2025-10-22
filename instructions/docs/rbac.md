# Sistema de Roles y Permisos (RBAC)

El backend de Django ahora utiliza un modelo RBAC basado en **Groups** y **Permissions** para controlar el acceso a las operaciones CRUD de entradas, categorías, etiquetas y comentarios. Este documento resume los roles disponibles, cómo inicializarlos y de qué forma se reflejan en la API pública.

## Roles disponibles

| Rol       | Descripción breve | Permisos principales |
|-----------|-------------------|----------------------|
| `admin`   | Control total del blog. | Gestión completa de entradas, categorías, etiquetas y comentarios, incluyendo publicación y moderación. |
| `editor`  | Equipo editorial. | Puede editar cualquier entrada, aprobar contenidos en revisión, publicar y moderar comentarios. |
| `author`  | Creadores de contenido. | Puede crear y editar sus propias entradas mientras estén en estado `draft` o `in_review`. |
| `reviewer`| Revisión interna. | Lectura de contenidos en revisión y posibilidad de comentar. |
| `reader`  | Lectura pública. | Lectura y creación de comentarios públicos. |

Los codenames asignados a cada rol se definen en `backend/blog/rbac.py`. Este archivo actúa como única fuente de verdad tanto para el comando de seed como para los tests.

### Estados editoriales de `Post`

Los posts incorporan un campo `status` con los valores:

- `draft`
- `in_review`
- `published`
- `archived`

Los autores sólo pueden modificar sus propios posts si el estado es `draft` o `in_review`. Editores y administradores pueden cambiar cualquier post y publicar (`published`) o archivar (`archived`).

## Inicialización de roles

Ejecuta el comando de gestión para crear o actualizar los grupos:

```bash
cd backend
python manage.py seed_roles
```

El comando es idempotente: actualiza los grupos existentes y asigna las combinaciones de permisos declaradas en `rbac.py`. Cualquier permiso ausente se reporta en consola.

## Asignación de roles a usuarios

### Desde la línea de comandos

En un shell de Django puedes usar los grupos directamente:

```python
from django.contrib.auth import get_user_model
from blog import rbac

user = get_user_model().objects.get(username="ana")
rbac.assign_roles(user, [rbac.Role.EDITOR])
```

### Desde la API

Se añadió el endpoint `/api/roles/` (sólo para administradores):

- `GET /api/roles/`: listado de roles disponibles con sus permisos.
- `POST /api/roles/`: asigna roles a un usuario. Payload de ejemplo:

  ```json
  {
    "user_id": 7,
    "roles": ["editor", "reviewer"]
  }
  ```

### Perfil del usuario autenticado

`GET /api/me/` devuelve los datos básicos del usuario, los roles vigentes y los permisos efectivos (lista de codenames). Útil para ocultar acciones en el frontend según el rol.

Respuesta ejemplo:

```json
{
  "id": 5,
  "username": "editor",
  "email": "editor@example.com",
  "first_name": "",
  "last_name": "",
  "roles": ["editor"],
  "permissions": [
    "blog.change_post",
    "blog.can_publish_post",
    "blog.can_moderate_comment"
  ]
}
```

## Reglas clave por recurso

- **Posts**
  - `admin` y `editor` pueden crear, editar, publicar y eliminar cualquier post.
  - `author` puede crear posts y editar/borrar los propios mientras estén en `draft` o `in_review`.
  - Estados `published` o `archived` requieren el permiso `can_publish_post`.
- **Categorías y etiquetas**
  - Sólo administradores (vía `IsAdminOrReadOnly`) pueden crear o modificar desde la API.
- **Comentarios**
  - Creación limitada a usuarios con `add_comment` (roles `reader`, `reviewer`, `author`, `editor`, `admin`).
  - Eliminación/Moderación sólo para roles con `can_moderate_comment` (editores y administradores).

## Cambios en el admin de Django

El panel muestra columnas para `status`, `created_by` y `modified_by`. Se añadieron acciones rápidas:

- **Marcar como borrador** (requiere `change_post`).
- **Enviar a revisión** (requiere `can_approve_post`).
- **Publicar** (requiere `can_publish_post`).

Los usuarios sin los permisos asociados no verán dichas acciones ni entradas ajenas.

## Auditoría

Los modelos guardan automáticamente:

- `created_by`: usuario que creó la entrada (se rellena en views y admin).
- `modified_by`: usuario del último cambio.

Las pruebas (`backend/blog/tests/test_rbac.py`) cubren este comportamiento.

## Ejemplos de uso vía cURL

Publicar un post como autor (token JWT):

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "title": "Mi borrador",
        "excerpt": "Resumen",
        "content": "Contenido",
        "tags": ["python"],
        "status": "draft"
      }' \
  https://backendblog.yampi.eu/api/posts/
```

Intentar editar un post publicado sin permisos devolverá `403 Forbidden`.

Para publicar (sólo editor/admin):

```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN_EDITOR" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}' \
  https://backendblog.yampi.eu/api/posts/<slug>/
```

## Recomendaciones para el frontend/backoffice

- Consulta `/api/me/` al iniciar sesión para habilitar botones o vistas según el rol.
- Oculta acciones de publicación/moderación cuando `permissions` no incluya los codenames correspondientes.
- Muestra estados editoriales y audita `created_by`/`modified_by` para los editores.

Con este esquema el backend queda preparado para un backoffice que delegue la lógica de permisos al servidor manteniendo consistencia y trazabilidad.
