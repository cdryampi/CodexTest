export const SITE_NAME = 'React Tailwind Blog';
export const SITE_DESCRIPTION =
  'Historias, guías y recursos sobre frontend moderno, React y Tailwind CSS en español.';
export const DEFAULT_OG_IMAGE = 'https://picsum.photos/seed/react-tailwind-blog/1200/630';
export const DEFAULT_TWITTER_CARD = 'summary_large_image';

/**
 * Limpia y acorta cadenas para usarlas en etiquetas meta.
 * @param {unknown} value Texto original
 * @param {number} maxLength Longitud máxima permitida
 * @returns {string}
 */
export function sanitizeMetaText(value, maxLength = 160) {
  if (value == null) {
    return '';
  }

  const text = value.toString().replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Construye títulos con el nombre del sitio.
 * @param {string} title
 * @returns {string}
 */
export function buildPageTitle(title) {
  if (!title) {
    return SITE_NAME;
  }

  return `${title} | ${SITE_NAME}`;
}
