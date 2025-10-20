I18n API — consumo desde el frontend
===================================

Idiomas disponibles
-------------------
- Español (`es`) es el idioma por defecto.
- Inglés (`en`) es la segunda variante publicada.

Resolución del idioma
---------------------
1. `?lang=<codigo>` tiene prioridad absoluta en cualquier endpoint.
2. Si no se especifica `lang`, el backend negocia con `Accept-Language`.
3. Para peticiones con cuerpo (`POST`, `PUT`, `PATCH`) puede declararse el idioma de escritura mediante el header `Content-Language`.
4. Cuando no se envía ningún selector se responde en el idioma por defecto (`es`).

Campos servidos
---------------
- Modo plano (por defecto): el serializer sólo devuelve los campos de la traducción activa.
- Modo expandido: añade `translations` con todas las variantes disponibles (`expand=translations` o `expand=translations=true`).
- Todos los payloads incluyen el header `Content-Language` con el idioma realmente usado.

Lectura desde el frontend
-------------------------
- Añadir `?lang=en` para forzar el inglés. Si la traducción no existe se devuelve el contenido en español manteniendo `Content-Language: en` (útil para detectar faltantes).
- Alternativamente se puede enviar `Accept-Language: en` sin query param. `?lang` siempre tiene prioridad.
- Para obtener todas las traducciones en una sola llamada: `?lang=en&expand=translations`.
- La búsqueda (`?search=`) filtra sobre los campos `title` y `excerpt` en el idioma activo.

Escritura de traducciones
-------------------------
- Usar `?lang=<codigo>` o `Content-Language: <codigo>` para indicar en qué idioma se guarda la entrada.
- El payload sólo debe contener los campos traducibles (`title`, `excerpt`, `content`, `name`, etc.) en la variante deseada; el backend no exige el resto de idiomas.
- Para crear etiquetas al vuelo usa la lista de nombres (`"tags": ["python"]`) en el idioma activo. El backend creará/actualizará la traducción correspondiente.

Ejemplos `curl`
---------------
Listado en inglés (modo plano):

```
curl \
  -H "Accept-Language: en" \
  "https://backendblog.yampi.eu/api/posts/?lang=en"
```

Detalle expandido con todas las traducciones:

```
curl \
  "https://backendblog.yampi.eu/api/posts/optimiza-el-renderizado-en-react/?lang=en&expand=translations=true"
```

Creación de traducción inglesa para un post existente:

```
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Content-Language: en" \
  "https://backendblog.yampi.eu/api/posts/optimiza-el-renderizado-en-react/?lang=en" \
  -d '{
    "title": "Optimize rendering in React",
    "excerpt": "Improve performance by rendering only what's needed",
    "content": "Long form content in English...",
    "tags": ["react", "performance"],
    "categories": []
  }'
```

Notas SEO
---------
- El `slug` es específico por idioma. El frontend debe guardar la pareja `{codigo_idioma, slug}` para construir URLs consistentes.
- Cuando falte la traducción solicitada el backend devuelve la versión por defecto pero mantiene `Content-Language` del idioma solicitado para poder detectar el hueco y solicitar la traducción correspondiente.

Asistente de traducción del frontend
------------------------------------
- Utiliza `?expand=translations` para mostrar al asistente todas las variantes existentes antes de generar nuevas propuestas.
- Al guardar la traducción sugerida envía cada idioma por separado con `?lang=` o `Content-Language`. No mezclar idiomas en un único payload.
- Si el asistente necesita crear etiquetas o categorías en otro idioma, envía sus nombres durante la edición; el backend generará los `slug` correctos automáticamente.

Pruebas rápidas para backend
----------------------------
- Antes de desplegar cambios en i18n ejecuta `python manage.py test blog.tests.test_i18n_api` desde `/backend` para asegurar que la negociación de idioma, el modo expandido y la escritura de traducciones siguen funcionando.
