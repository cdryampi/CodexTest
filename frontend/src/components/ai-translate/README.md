# Asistente de traducción

Este módulo incorpora un flujo de asistencia para traducir posts, categorías y etiquetas desde el dashboard editorial. Se apoya en la API de OpenAI a través del backend de Django, que actúa como proxy autenticado y mantiene la clave segura en el servidor.

## Componentes principales

- **`TranslateButton`**: botón estilo shadcn que habilita el asistente siempre que exista una clave válida. Muestra un `Tooltip` cuando la integración está deshabilitada o cuando el flujo requiere contexto adicional.
- **`TranslateModal`**: diálogo accesible (Radix + shadcn + Framer Motion) con selector de idioma, opciones para preservar formato y reducir tokens, pestañas por campo, caché en `sessionStorage` y acciones para traducir, insertar en formularios o guardar directamente en el backend (`?lang=en|ca`).
- **`LanguageFlags`**: chips interactivos con estado por idioma (pendiente/listo/guardado).
- **`LoadingBar`**: barra de progreso ligera para indicar actividad durante peticiones de IA o persistencia.

## Flujo de uso

1. **Requisitos previos**: iniciar sesión en el backoffice y configurar `OPEN_IA_KEY` en el entorno del backend. Si el usuario no está autenticado o el backend no dispone de la clave, los botones de traducción permanecen deshabilitados.
2. **Iniciar traducción**: desde los formularios de post, categoría o etiqueta, pulsa el botón "Traducir" para abrir el modal. El asistente detecta el idioma origen (por defecto español) y permite elegir 🇬🇧 `en` o 🇨🇦 `ca` como destino.
3. **Optimizar tokens**:
   - La opción *Solo título + resumen* reduce el payload a `title` y `excerpt` antes de llamar a OpenAI.
   - El toggle *Conservar formato Markdown/HTML* mantiene etiquetas y formato original. Desactívalo si prefieres texto plano.
4. **Revisión**: cada campo aparece en una pestaña con la versión original (solo lectura) y la propuesta editable. Las respuestas se almacenan en caché por sesión (`entityType+lang+hash`) para evitar llamadas repetidas.
5. **Insertar en formulario**: al confirmar, el asistente reemplaza temporalmente los inputs locales para permitir ajustes manuales antes de guardar.
6. **Guardar en backend**: envía un `PUT` a `/api/<entity>/?lang=<destino>` con los campos traducidos (`title`, `excerpt`, `content`, `slug` para posts; `name`, `description`, `slug` para categorías; `name`, `slug` para etiquetas).
7. **Mensajería**: se utiliza `sonner` para notificar estados (éxito, error, cuota excedida). Los incidentes se registran en consola con el prefijo `[AI Translate]`, sin exponer los textos enviados a OpenAI.

## Límites y consideraciones

- Los textos de más de ~1 800 caracteres requieren confirmación explícita y el backend rechaza cuerpos que superan los 2 000 caracteres por campo.
- El asistente deriva el slug traducido con `generateLocalizedSlug` a partir del título/nombre sugerido; puedes editarlo manualmente antes de insertar o guardar.
- Las traducciones se realizan campo a campo (una llamada por campo seleccionado) para mejorar el control de tokens y la calidad de cada resultado.
- El frontend nunca recibe la clave de OpenAI: todas las peticiones pasan por `/api/ai/translations/`, que agrega la cabecera en el backend.
- Si el backend no está listo para persistir traducciones, el botón "Guardar en backend" aparecerá deshabilitado.

## Privacidad

Al activar el asistente aceptas enviar el texto actual al backend, que a su vez lo reenvía a OpenAI exclusivamente para traducirlo. No se registra ni reenvía el contenido más allá de la petición concreta, y puedes limpiar el caché cerrando la pestaña del navegador.

## Extensión futura

- Incorporar métricas de coste o consumo de tokens por traducción.
- Guardar historial de traducciones por entidad para acelerar ediciones colaborativas.
- Permitir streaming o respuestas parciales para campos largos.
