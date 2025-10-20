# Reacciones en el blog

La API del blog permite que los usuarios registren reacciones ligeras sobre las entradas sin necesidad de añadir un comentario. Esta guía resume cómo funciona la integración completa y qué debes tener en cuenta al extenderla.

## Descripción funcional
- Cada entrada expone un resumen de las reacciones acumuladas.
- Los usuarios autenticados pueden alternar su reacción personal con una sola petición.
- El frontend consume los endpoints dedicados sin transformaciones adicionales; únicamente normaliza los recuentos para prevenir valores `undefined`.

## Tipos de reacción disponibles
Los tipos están definidos en `blog.models.Reaction.Types` y se mantienen sincronizados entre backend y frontend:

| Clave | Descripción |
|-------|-------------|
| `like` | Me gusta |
| `love` | Me encanta |
| `clap` | Aplausos |
| `wow` | Asombro |
| `laugh` | Me divierte |
| `insight` | Interesante |

## Reglas de alternancia
1. Si el usuario no ha reaccionado aún, la API crea una nueva reacción con el tipo indicado.
2. Si ya existe una reacción del mismo tipo, se elimina (toggle off).
3. Si existe una reacción de otro tipo, se reemplaza por la nueva (manteniendo un único registro activo por usuario y entrada).
4. Las respuestas siempre devuelven el resumen completo actualizado para evitar lecturas adicionales.

## Throttling
- Ambas acciones (`GET reactions` y `POST react`) comparten el `throttle_scope = "reactions"`.
- Los valores por defecto se definen en `REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['reactions']` (actualmente `30/min`).
- En entornos con mucho tráfico puedes ajustar ese valor sin tocar el código de vistas.

## Permisos
- Consultar el resumen (`GET`) es público.
- Registrar una reacción (`POST`) requiere autenticación; los usuarios anónimos reciben `401 Unauthorized`.

## Endpoints disponibles
- `GET /api/posts/{slug}/reactions/`
  - Responde con el resumen agregado.
- `POST /api/posts/{slug}/react/`
  - Recibe `{ "type": "like" }` y aplica la lógica de alternancia.

### Ejemplos de uso
**GET resumen**
```http
GET /api/posts/optimiza-el-renderizado-en-react/reactions/
Accept: application/json
```

```json
{
  "counts": {
    "like": 3,
    "love": 1,
    "clap": 0,
    "wow": 2,
    "laugh": 0,
    "insight": 0
  },
  "total": 6,
  "my_reaction": null
}
```

**POST alternancia**
```http
POST /api/posts/optimiza-el-renderizado-en-react/react/
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "wow"
}
```

Respuesta:
```json
{
  "counts": {
    "like": 3,
    "love": 1,
    "clap": 0,
    "wow": 3,
    "laugh": 0,
    "insight": 0
  },
  "total": 7,
  "my_reaction": "wow"
}
```

## Extender a comentarios u otros modelos
El modelo `Reaction` utiliza `GenericForeignKey`, por lo que puede enlazarse con comentarios u otros recursos:
1. Asegúrate de obtener la instancia destino (por ejemplo, un comentario) y pasa `content_object=<instancia>` al crear la reacción.
2. Implementa acciones análogas en el ViewSet correspondiente reutilizando `ReactionSummarySerializer` y `ReactionToggleSerializer`.
3. Registra un `throttle_scope` específico si necesitas límites distintos.
4. Actualiza la documentación en este mismo directorio para detallar los nuevos endpoints.
