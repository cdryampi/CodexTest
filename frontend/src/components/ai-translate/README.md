# Asistente de traducción

Este módulo incorpora un flujo de asistencia para traducir posts, categorías y etiquetas desde el dashboard editorial. Se apoya en la API de OpenAI usando la clave expuesta en `VITE_OPEN_IA_KEY` y funciona íntegramente en el cliente.

## Componentes principales

- **`TranslateButton`**: botón estilo shadcn que habilita el asistente siempre que exista una clave válida. Muestra un `Tooltip` cuando la integración está deshabilitada o cuando el flujo requiere contexto adicional.
- **`TranslateModal`**: diálogo accesible (Radix + shadcn + Framer Motion) con selector de idioma, opciones para preservar formato y reducir tokens, pestañas por campo, caché en `sessionStorage` y acciones para traducir, insertar en formularios o guardar directamente en el backend (`?lang=en|ca`).
- **`LanguageFlags`**: chips interactivos con estado por idioma (pendiente/listo/guardado).
- **`LoadingBar`**: barra de progreso ligera para indicar actividad durante peticiones de IA o persistencia.

## Flujo de uso

1. **Requisitos previos**: definir `VITE_OPEN_IA_KEY` en el entorno. Sin esta clave los botones de traducción permanecen deshabilitados.
2. **Iniciar traducción**: desde los formularios de post, categoría o etiqueta, pulsa el botón "Traducir" para abrir el modal. El asistente detecta el idioma origen (por defecto español) y permite elegir 🇬🇧 `en` o 🇨🇦 `ca` como destino.
3. **Optimizar tokens**:
   - La opción *Solo título + resumen* reduce el payload a `title` y `excerpt` antes de llamar a OpenAI.
   - El toggle *Conservar formato Markdown/HTML* mantiene etiquetas y formato original. Desactívalo si prefieres texto plano.
4. **Revisión**: cada campo aparece en una pestaña con la versión original (solo lectura) y la propuesta editable. Las respuestas se almacenan en caché por sesión (`entityType+lang+hash`) para evitar llamadas repetidas.
5. **Insertar en formulario**: al confirmar, el asistente reemplaza temporalmente los inputs locales para permitir ajustes manuales antes de guardar.
6. **Guardar en backend**: envía un `PUT` a `/api/<entity>/?lang=<destino>` con los campos traducidos (`title`, `excerpt`, `content`, `slug` para posts; `name`, `description`, `slug` para categorías; `name`, `slug` para etiquetas).
7. **Mensajería**: se utiliza `sonner` para notificar estados (éxito, error, cuota excedida). No se registran en consola ni se persisten los textos enviados a OpenAI.

## Límites y consideraciones

- Los textos de más de ~4 500 caracteres requieren confirmación explícita desde el modal antes de enviarse a OpenAI.
- El asistente deriva el slug traducido con `generateLocalizedSlug` a partir del título/nombre sugerido; puedes editarlo manualmente antes de insertar o guardar.
- Las traducciones se realizan campo a campo (una llamada por campo seleccionado) para mejorar el control de tokens y la calidad de cada resultado.
- El frontend nunca almacena la clave de OpenAI en `localStorage` o `sessionStorage`; solo se lee desde `import.meta.env`.
- Si el backend no está listo para persistir traducciones, el botón "Guardar en backend" aparecerá deshabilitado.

## Privacidad

Al activar el asistente aceptas enviar el texto actual a los servidores de OpenAI exclusivamente para traducirlo. No se registra ni reenvía el contenido más allá de la petición concreta, y puedes limpiar el caché cerrando la pestaña del navegador.

## Extensión futura

- Añadir un proxy backend para ocultar la API key cuando se requiera endurecer la seguridad.
- Incorporar métricas de coste o consumo de tokens por traducción.
- Guardar historial de traducciones por entidad para acelerar ediciones colaborativas.
