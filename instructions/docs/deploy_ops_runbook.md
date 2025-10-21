# Despliegue – Runbook de Operaciones

Procedimientos estándar para operar el stack Docker/Dokploy de este proyecto.

## Comandos frecuentes (Docker Compose)

```bash
# Levantar/actualizar contenedores locales
docker compose -f deploy/docker-compose.yml up -d

# Ver logs en vivo
docker compose -f deploy/docker-compose.yml logs -f backend

docker compose -f deploy/docker-compose.yml logs -f postgres

# Ejecutar comandos dentro del backend
docker compose -f deploy/docker-compose.yml exec backend python manage.py migrate

docker compose -f deploy/docker-compose.yml exec backend python manage.py collectstatic --noinput

docker compose -f deploy/docker-compose.yml exec backend python manage.py seed_categories

# Entrar con shell interactiva
docker compose -f deploy/docker-compose.yml exec backend sh

# Reiniciar un servicio
docker compose -f deploy/docker-compose.yml restart backend
```

## Operaciones en Dokploy

- **Logs**: desde la UI ve la pestaña *Logs* o usa `dokploy-cli logs <service> --follow`.
- **Exec**: `dokploy-cli exec backend -- python manage.py migrate`.
- **Actualizar tags**: editar el servicio y seleccionar la etiqueta deseada.
- **Reiniciar**: botón *Restart* fuerza un redeploy usando la imagen ya descargada.

## Migraciones on-demand

1. Asegúrate de tener respaldos actualizados de la base de datos.
2. Ejecuta:
   ```bash
   dokploy-cli exec backend -- python manage.py migrate
   dokploy-cli exec backend -- python manage.py collectstatic --noinput
   ```
3. Si necesitas semillas de demo:
   ```bash
   dokploy-cli exec backend -- python manage.py seed_categories
   dokploy-cli exec backend -- python manage.py seed_all --fast
   ```
4. Verifica el healthcheck (`dokploy-cli ps`) antes de cerrar la ventana de mantenimiento.

## Gestión de estáticos y media

- Estáticos (`/app/staticfiles`) se regeneran automáticamente con `collectstatic`.
- Media (`/app/media`) reside en un volumen persistente (`backend_media`).
  - Para listar: `dokploy-cli exec backend -- ls -al /app/media`.
  - Para respaldar: monta el volumen en otra instancia o usa `dokploy-cli volume export` (si está disponible).

## Limpieza de volúmenes

- Local:
  ```bash
  docker compose -f deploy/docker-compose.yml down --volumes
  docker volume rm pgdata_v3 backend_media
  ```
- Dokploy: elimina el volumen desde la pestaña *Volumes* solo tras confirmar que existen backups.

## Troubleshooting

| Síntoma | Posible causa | Solución |
| ------- | ------------- | -------- |
| 502/504 desde Dokploy | backend sin levantar o healthcheck fallido | Revisa logs, ejecuta `dokploy-cli exec backend -- python manage.py migrate` y reinicia servicio |
| Error CORS en frontend | `CORS_ALLOWED_ORIGINS` o `CSRF_TRUSTED_ORIGINS` incompletos | Añade dominio del frontend (incluyendo esquema `https://`) y redeploya |
| `DisallowedHost` en Django | `ALLOWED_HOSTS` no incluye el dominio | Agrega dominio público e interno de Dokploy |
| Media no disponible | volumen `backend_media` sin permisos o no montado | Verifica configuración de volumen y permisos (`chown`/`chmod`) |
| Migraciones colgando | Base de datos inaccesible | Comprueba servicio PostgreSQL, revisa credenciales y variables `POSTGRES_*` |
| Errores OpenAI | `VITE_OPEN_IA_KEY` faltante o inválida | Confirma valor en `.env`, Secrets de GitHub y Dokploy |
| Timeouts Gunicorn/Nginx | `GUNICORN_TIMEOUT` insuficiente o recursos limitados | Incrementa `GUNICORN_TIMEOUT`, escala workers o revisa métricas |

## Observabilidad y Healthchecks

- Endpoint actual: `/admin/login/` (HTTP 200) usado como healthcheck básico.
- Próximos pasos sugeridos:
  - Integrar [`django-health-check`](https://github.com/KristianOellegaard/django-health-check) para exponer `/ht/`.
  - Añadir [`django-prometheus`](https://github.com/korfuri/django-prometheus) y publicar métricas en `/metrics`.
  - Configurar alertas en Dokploy para cuando el healthcheck falle más de `N` veces consecutivas.

## Checklist tras incidencias

1. Confirmar que todos los contenedores están `healthy` (`dokploy-cli ps`).
2. Revisar logs del último despliegue (`dokploy-cli logs backend --tail 200`).
3. Ejecutar un smoke test manual (`curl -fsS https://api.example.com/api/categories/`).
4. Verificar integridad de volúmenes (`dokploy-cli volume ls`).
5. Documentar acciones tomadas en el historial del proyecto.

Conserva este runbook actualizado tras cada incidente o cambio de arquitectura.
