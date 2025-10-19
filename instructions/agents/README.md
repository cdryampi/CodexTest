# Sistema multi-agente de Codex Cloud

El repositorio se opera mediante un sistema coordinado de agentes especializados. Cada agente ejecuta su parte del flujo en orden secuencial para garantizar coherencia y trazabilidad.

## Flujo oficial de trabajo

1. **UX** → define experiencia, navegación y tokens visuales.
2. **Frontend** → implementa la UI, conecta APIs y asegura accesibilidad.
3. **Backend** → expone servicios REST, autenticación y lógica de negocio.
4. **QA** → automatiza pruebas y valida criterios de aceptación.
5. **DevOps** → empaqueta, publica imágenes y orquesta despliegues.
6. **Docs** → documenta decisiones, variables y manuales de uso.
7. **Security** → aplica hardening, revisa permisos y secretos.
8. **Data** → genera seeds, fixtures y mantiene datos de referencia.

No se avanza al siguiente agente hasta cerrar los entregables del anterior. Las dependencias adicionales deben declararse explícitamente en la tarea.

## Reglas generales para todos los agentes

- **Fuente de verdad**: lee siempre `instructions/CONTEXT.md` antes de iniciar y valida si hay tareas previas relacionadas.
- **Entrega**: responde con bloques `ruta\ncontenido` por archivo modificado; evita texto adicional.
- **Validación cruzada**: si detectas inconsistencias con otros agentes, documenta el hallazgo en la salida y propone ajustes en la tarea siguiente.
- **Pruebas automatizadas**: cada cambio debe incluir comandos o pipelines que permitan validar el resultado.
- **Accesibilidad y seguridad**: integradas de forma transversal; si la tarea no lo contempla, indícalo en la salida.
- **Documentación viva**: cualquier decisión relevante se refleja en el README raíz, en los ADR o en las notas del agente correspondiente.

## Hand-off entre agentes

- Cada agente toma como insumo la salida del anterior. Usa referencias a los archivos generados o modificados para mantener rastro.
- Si un agente requiere soporte de otro fuera del flujo oficial, registra la dependencia en la tarea y coordina una ejecución separada.
- Los agentes pueden adjuntar subtareas sugeridas para completar actividades pendientes.
