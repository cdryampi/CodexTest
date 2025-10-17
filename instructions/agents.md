# Guía general del monorepo

Este repositorio se reorganizó como un monorepo para alojar los módulos de frontend, backend, despliegue y documentación colaborativa. Cada carpeta define límites claros para que los diferentes agentes de Codex puedan trabajar sin interferencias y con una visión compartida del producto.

## Estructura principal
- **/frontend**: contiene todo el código y la configuración del cliente React desplegado en GitHub Pages.
- **/backend**: carpeta reservada para la futura API de Django REST. Aún no posee código funcional.
- **/deploy**: almacena la configuración declarativa para los entornos Docker y Dokploy que orquestarán el backend y futuros servicios.
- **/instructions**: documentación modular para cada agente (frontend, backend, deploy y UX) además de esta guía general.

## Integración prevista
- **Frontend**: continúa construyéndose con Vite + React 18. El pipeline existente en `.github/workflows/deploy.yml` mantiene el despliegue automático del contenido generado en `/frontend` hacia GitHub Pages.
- **Backend**: se implementará en Django REST Framework y se publicará como imágenes en GitHub Container Registry (GHCR). Su entrega continua se integrará más adelante en el mismo workflow o en uno complementario.
- **Deploy**: encapsulará Dockerfiles, `docker-compose` y configuraciones de Nginx para soportar el backend y servir el frontend estático desde contenedores listos para Dokploy.

## CI/CD actual y futura
- **Actual**: sólo ejecuta la compilación del frontend desde la raíz del repositorio con `npm ci` y `npm run build`, sin modificaciones respecto al flujo previo.
- **Futura**: añadirá pipelines para construir imágenes Docker, publicarlas en GHCR y orquestar despliegues coordinados entre frontend estático y backend en Dokploy.

## Lineamientos para agentes Codex
- **Frontend** (`instructions/frontend/agents_frontend.md`): trabajar exclusivamente dentro de `/frontend`, respetando el build actual hacia GitHub Pages.
- **Backend** (`instructions/backend/agents_backend.md`): preparar la API Django dentro de `/backend`, integrando autenticación y endpoints REST cuando se habilite.
- **Deploy** (`instructions/deploy/agents_deploy.md`): diseñar la infraestructura Docker/Dokploy en `/deploy`, asegurando compatibilidad con los pipelines de GHCR.
- **UX** (`instructions/ux/agents_ux.md`): documentar lineamientos de diseño, accesibilidad y UX que apliquen sobre los módulos existentes.

Consulta cada archivo específico antes de modificar código o documentación en su respectiva carpeta. Mantén la sincronización con el pipeline vigente de GitHub Pages y deja comentarios en `/deploy` si se planean cambios que aún no deben ejecutarse.
