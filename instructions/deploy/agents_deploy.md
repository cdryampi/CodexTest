# AGENTE DEPLOY – ESTRATEGIA DOCKER + DOKPLOY (CARPETA `/deploy`)

La carpeta `/deploy` alojará los artefactos necesarios para contenedizar el frontend y el backend, y para automatizar su entrega con Dokploy.

Alcance actual:
- Mantener archivos de ejemplo o placeholders que describan la intención (Dockerfile, `docker-compose.yml`, `nginx.conf`).
- Documentar, mediante comentarios, cómo se integrarán Docker y Dokploy sin alterar el pipeline vigente de GitHub Pages.

Próximos pasos esperados cuando se habilite el trabajo activo:
- Construir imágenes multi-stage para el frontend y backend.
- Publicar imágenes en GitHub Container Registry (GHCR).
- Definir servicios, redes y volúmenes en `docker-compose.yml` para orquestar la aplicación completa.
- Ajustar Nginx como reverse proxy/static server compatible con Dokploy.

No modifiques `.github/workflows/deploy.yml` hasta que se apruebe el pipeline Dockerizado. En su lugar, deja anotaciones aquí y en los placeholders para guiar la migración futura.
