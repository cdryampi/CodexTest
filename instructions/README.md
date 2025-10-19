# Manual de coordinación de instrucciones

Este directorio centraliza el conocimiento operativo del monorepo. Sigue el flujo de lectura recomendado para evitar inconsistencias entre agentes y tareas:

1. **`instructions/CONTEXT.md`** — resumen vivo del estado funcional del proyecto.
2. **`instructions/README.md`** — (este documento) reglas de coordinación y convenciones de entrega.
3. **`instructions/agents/`** — guías por agente en el orden indicado.
4. **`instructions/tasks/`** — tareas atómicas listas para ejecutar.

## Estructura y alcance

- `agents/`: define el sistema multi-agente, responsabilidades y handoffs.
- `tasks/`: prompts listos para Codex Cloud. Incluye `TEMPLATE_TASK.md` para generar nuevas tareas.
- `frontend/`, `backend/`, `deploy/`, `ux/`: documentación histórica previa. Refiérete a los agentes antes de revisarlos.

## Convenciones generales

- **Idioma**: toda la documentación y código generado debe estar en español técnico.
- **Formato de entrega**: cada agente o tarea debe devolver *por cada archivo creado o modificado* dos líneas consecutivas: la ruta (relativa al repositorio) y el contenido completo del archivo. No se añaden comentarios adicionales fuera de esos bloques.
- **Compatibilidad tecnológica**: respeta las versiones fijadas en el repositorio (React + Vite + Tailwind, Django 5 + DRF, Dokploy + GHCR) salvo que una tarea indique lo contrario.
- **Idempotencia**: cada tarea debe poder ejecutarse múltiples veces sin introducir estados inconsistentes.
- **Orden de ejecución**: siempre coordina a los agentes en el flujo `UX → Frontend → Backend → QA → DevOps → Docs → Security → Data`, a menos que la tarea especifique otra dependencia.

## Cómo exprimir Codex Cloud

1. **Desglosa objetivos**: crea tareas en `instructions/tasks/` con un alcance concreto y entregables verificables.
2. **Define criterios de aceptación**: describe pruebas, comandos o validaciones que permiten confirmar la finalización.
3. **Encadena agentes**: asigna subtareas según el flujo del sistema. Usa la salida de un agente como insumo del siguiente.
4. **Documenta variables de entorno**: cualquier cambio en configuración debe reflejarse en `.env.example` y en la documentación.
5. **Automatiza la revisión**: incluye pruebas unitarias, de integración y pipelines en las tareas para acelerar QA.
6. **Itera en ciclos cortos**: evita tareas masivas; prioriza entregables pequeños y comprobables.

## Actualización del conocimiento

- Al modificar contexto, registra cambios relevantes en `instructions/CHANGELOG.md`.
- Añade nuevas tareas a `instructions/tasks/` siguiendo la plantilla.
- Mantén sincronizado el README raíz cuando cambie la arquitectura o los procesos globales.
