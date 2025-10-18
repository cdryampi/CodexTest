/**
 * Definiciones de tipos compartidas por el cliente API.
 * Estos JSDoc imitan la forma en que Django REST Framework
 * expone los datos a través de sus serializers públicos.
 *
 * Mantenerlos sincronizados con `blog/serializers.py`
 * evita sorpresas al trabajar con datos locales o remotos.
 */

/**
 * @typedef {Object} Category
 * @property {string} slug Slug único de la categoría.
 * @property {string} name Nombre público.
 * @property {string} description Descripción corta.
 * @property {boolean} is_active Indicador de visibilidad.
 * @property {number} post_count Número de posts asociados.
 */

/**
 * @typedef {string} TagName
 */

/**
 * @typedef {Object} PostListItem
 * @property {number|string} id Identificador estable.
 * @property {string} slug Slug público utilizado en la URL.
 * @property {string} title Título renderizable.
 * @property {string} excerpt Resumen de la publicación.
 * @property {TagName[]} tags Nombres de etiquetas asociados.
 * @property {string} [content] Contenido completo cuando está disponible.
 * @property {string[]} categories Slugs de categorías asignadas.
 * @property {Category[]} categories_detail Detalle completo de categorías.
 * @property {string|null} created_at Fecha de creación normalizada (ISO 8601 o `null`).
 * @property {string|null} [updated_at] Fecha de actualización (cuando está disponible).
 * @property {string} [author] Nombre de la persona autora.
 * @property {string|null} [image] Imagen principal.
 * @property {string|null} [thumb] Miniatura recomendada por la API.
 * @property {string|null} [thumbnail] Alias interno usado por la UI.
 * @property {string|null} [imageAlt] Texto alternativo de la imagen.
 */

/**
 * @typedef {PostListItem & {
 *   content: string,
 *   author: string,
 *   image: string|null,
 *   thumb: string|null,
 *   thumbnail: string|null,
 *   imageAlt: string|null,
 *   updated_at: string|null
 * }} PostDetail
 */

/**
 * @typedef {Object} Comment
 * @property {number|string} id Identificador del comentario.
 * @property {string} author_name Nombre mostrado.
 * @property {string} content Texto del comentario ya saneado.
 * @property {string|null} created_at Marca de tiempo en ISO 8601.
 * @property {number|string|null} [parent] ID del comentario padre cuando existe.
 * @property {boolean} [isLocalOnly] Indica que aún no se sincronizó con el backend.
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} results Registros devueltos en la página actual.
 * @property {number} count Total de elementos disponibles.
 * @property {string|null} next URL de la página siguiente o `null`.
 * @property {string|null} previous URL de la página previa o `null`.
 */

export {};
