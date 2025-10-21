# Deploy – Checklist Ready-to-Ship

Utiliza esta lista antes de promover cambios a producción.

- [ ] `.env` completo para cada entorno (local, staging, prod) usando `/deploy/templates/.env.sample`.
- [ ] `DJANGO_SECRET_KEY` y claves sensibles cargadas en GitHub Secrets y Dokploy.
- [ ] `ALLOWED_HOSTS` incluye dominios públicos, internos y `localhost` cuando aplique.
- [ ] `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` contienen URLs con esquema (`https://`).
- [ ] `VITE_OPEN_IA_KEY` presente en frontend (`.env`, GitHub Secrets, Dokploy`).
- [ ] Base de datos accesible: migraciones aplicadas (`python manage.py migrate`) y seeds opcionales ejecutados.
- [ ] `collectstatic --noinput` completó sin errores; archivos en volumen persistente.
- [ ] Volúmenes `backend_media` y `pgdata_v3` con permisos correctos y backup reciente.
- [ ] Healthcheck responde (`curl -fsS https://api.example.com/api/categories/` o `/admin/login/`).
- [ ] Certificados SSL activos en Dokploy (Let's Encrypt) y dominios correctos.
- [ ] Tags disponibles en GHCR (`latest`, `sha-<hash>`, semver). Documentado plan de rollback.
- [ ] Backups (DB/media) probados y plan de restauración documentado.
- [ ] Monitorización configurada o plan para habilitar `django-health-check`/`django-prometheus`.

Marca todos los ítems antes de cualquier `redeploy` en producción.
