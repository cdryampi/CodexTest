# Guía rápida del agente Frontend

La aplicación React ahora vive en la carpeta `/frontend`. Antes de realizar cambios revisa `instructions/frontend/agents_frontend.md`, donde se detallan los lineamientos completos heredados del proyecto original.

Resumen:
- Ejecuta comandos con `npm` desde la raíz, ya que el pipeline existente depende de `npm ci` y `npm run build`.
- Todos los archivos de código, assets y configuraciones específicas del cliente están bajo `/frontend`.
- Mantén la compatibilidad con el despliegue en GitHub Pages definido en `.github/workflows/deploy.yml`.
- **Respeta la resolución de API** en `src/utils/apiBase.js`: ninguna URL del backend puede hardcodearse; siempre usa `import.meta.env.VITE_API_BASE_URL`.
