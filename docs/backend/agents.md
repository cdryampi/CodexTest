# Agentes del Backend

> Sigue las pautas globales en `../../instructions/agents.md` y las específicas del módulo en `../../instructions/backend/agents_backend.md` antes de coordinar o modificar flujos.

## Tabla de contenidos
- [Agente de pruebas (`agents_backend_test`)](#agente-de-pruebas-agents_backend_test)
  - [Objetivo](#objetivo)
  - [Flujo de trabajo](#flujo-de-trabajo)
  - [Variables de entorno en CI](#variables-de-entorno-en-ci)
  - [Criterios de aprobación y fallos comunes](#criterios-de-aprobación-y-fallos-comunes)
- [Agente de deploy del backend](#agente-de-deploy-del-backend)
  - [Responsabilidades](#responsabilidades)
  - [Interacciones con Dokploy](#interacciones-con-dokploy)
  - [Rollback y healthchecks](#rollback-y-healthchecks)
- [Agente de seeds (opcional)](#agente-de-seeds-opcional)
  - [Cuándo activarlo](#cuándo-activarlo)
  - [Riesgos y controles](#riesgos-y-controles)
- [Mantenimiento evolutivo](#mantenimiento-evolutivo)

## Agente de pruebas (`agents_backend_test`)
### Objetivo
Garantizar que cada Pull Request o despliegue candidato preserve la integridad del backend Django descrito en `../README.md`.

### Flujo de trabajo
1. **Provisionamiento**: levanta una base de datos Postgres efímera (Docker service o contenedor sidecar).
2. **Configuración de entorno**: exporta las variables mínimas (`SECRET_KEY`, `DEBUG=false`, `ALLOWED_HOSTS=127.0.0.1`, `DATABASE_URL=postgres://...`).
3. **Migraciones**: ejecuta `python manage.py migrate --noinput`.
4. **Estáticos**: `python manage.py collectstatic --noinput` para validar WhiteNoise.
5. **Seeds opcionales**: si `ALLOW_SEED=true`, lanza `python manage.py seed_all --fast` para poblar datos básicos.
6. **Smoke tests HTTP**: realiza peticiones `curl --fail` contra `/admin/login/`, `/static/admin/css/base.css` y `/api/` esperando código 200.
7. **Pruebas unitarias**: `python manage.py test` (respetar `PYTHONPATH=/backend`).
8. **Artefactos**: recopila logs, reportes HTML/JUnit y migra a almacenamiento temporal del pipeline.
9. **Limpieza**: detiene contenedores/servicios y purga datos temporales.

### Variables de entorno en CI
Configurar secretos seguros en el sistema de CI (GitHub Actions, GitLab CI, Dokploy runners). Valores sugeridos:

| Variable | Valor sugerido | Notas |
| --- | --- | --- |
| `SECRET_KEY` | `ci-secret-key` | Cambiar periódicamente. |
| `DEBUG` | `false` | Debe ejecutarse en modo producción. |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Añadir hostname del runner si aplica. |
| `CORS_ALLOWED_ORIGINS` | `http://127.0.0.1:8000` | Necesario para pruebas de swagger. |
| `CSRF_TRUSTED_ORIGINS` | `http://127.0.0.1:8000` | Evita falsos positivos en formularios. |
| `DATABASE_URL` | `postgres://postgres:postgres@127.0.0.1:5432/postgres` | O usa variables `POSTGRES_*`. |
| `ALLOW_SEED` | `true` | Habilita `seed_all --fast`. |
| `ALLOW_SEED_RESET` | `false` | Evita borrado involuntario. |
| `SEED_ON_MIGRATE` | `false` | Solo para entornos efímeros específicos. |
| `STATIC_SEED_MODE` | `true` | Mantiene fixtures deterministas. |
| `DB_MAX_RETRIES` | `30` | Sincronizado con entrypoint. |
| `DB_RETRY_DELAY` | `1` | Segundos entre reintentos. |

### Criterios de aprobación y fallos comunes
- **Aprobado**: todas las etapas anteriores completan con código 0 y las pruebas retornan verde.
- **Fallo típico – Migrations**: `django.db.utils.OperationalError` indica que Postgres no está listo; aumentar `DB_MAX_RETRIES` o añadir espera.
- **Fallo típico – Staticfiles**: errores de `collectstatic` apuntan a rutas incorrectas o permisos; revisar configuración de `STATIC_ROOT`.
- **Fallo típico – Tests**: revisar `backend/blog/tests.py`; actualizar fixtures o seeds si cambió el contrato.
- **Fallo típico – Smoke tests**: códigos 403/400 suelen asociarse a `ALLOWED_HOSTS` o `CSRF_TRUSTED_ORIGINS`.

## Agente de deploy del backend
### Responsabilidades
- Ejecutar el entrypoint `deploy/backend/entrypoint.sh` o replicar sus pasos (migraciones + collectstatic + arranque Gunicorn).
- Validar que `STATIC_ROOT` y `MEDIA_ROOT` existan/monten volúmenes adecuados antes del arranque.
- Administrar variables `GUNICORN_WORKERS`, `GUNICORN_THREADS`, `GUNICORN_TIMEOUT` basadas en recursos del cluster Dokploy.
- Registrar la versión desplegada y actualizar `SPECTACULAR_SETTINGS["VERSION"]` cuando se publique una release.

### Interacciones con Dokploy
- El agente debe coordinarse con los manifiestos en `../../deploy`.
- Cambios en variables de entorno requieren un **redeploy** completo para propagarse.
- Recomienda activar healthchecks HTTP de Dokploy apuntando a `/api/` y `/admin/login/` con timeout < 10s.
- Para migraciones largas, configurar ventanas de mantenimiento o ejecutar `manage.py migrate` manualmente antes del redeploy.

### Rollback y healthchecks
- Tras cada despliegue, monitorear:
  - `/api/` responde 200 en < 500 ms.
  - `/admin/login/` disponible con assets.
  - Logs de Gunicorn sin trazas de error.
- Si algún check falla:
  1. Ejecutar rollback al artefacto previo (imagen Docker anterior).
  2. Restaurar la base de datos desde snapshot/backup si las migraciones fueron destructivas.
  3. Notificar a infraestructura y registrar incidente en el canal correspondiente.

## Agente de seeds (opcional)
### Cuándo activarlo
- Entornos efímeros (preview apps, QA temporales) donde se requiera contenido demo inmediato.
- Sesiones de testing manual que necesitan variedad de posts/comentarios.
- No usar en producción estable salvo para campañas puntuales con control manual.

### Riesgos y controles
- Requiere `ALLOW_SEED=true`; validar que no se ejecute por accidente en producción.
- `seed_all --reset` exige `ALLOW_SEED_RESET=true`; doble confirmación antes de habilitarlo.
- El volumen de datos depende de `--fast` o de los valores por defecto (300 posts, 40 usuarios, 3-12 comentarios por post); ajustar parámetros para evitar sobrecargar la base.
- Verifica logs tras cada ejecución y registra el resumen de `created/skipped` en la bitácora del entorno.

## Mantenimiento evolutivo
- Actualiza paginación, filtros y ordenación modificando `blog/pagination.py` y la configuración de `REST_FRAMEWORK`; documenta los cambios en `../README.md`.
- Añade nuevas pruebas en `backend/blog/tests.py` y extiende el pipeline de `agents_backend_test` si se agregan endpoints.
- Cuando se introduzcan endpoints adicionales, registra los contratos en la sección [API](../README.md#api-referencia) e incrementa la versión de `SPECTACULAR_SETTINGS` siguiendo SemVer.
- Coordina modificaciones con los agentes de frontend y deploy a través de los documentos en `../../instructions/frontend` y `../../instructions/deploy`.
