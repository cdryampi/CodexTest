const FIELD_MAP = {
  post: ['title', 'excerpt', 'content', 'slug'],
  category: ['name', 'description', 'slug'],
  tag: ['name', 'slug']
};

export function hashText(str) {
  const input = (str ?? '').toString();
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export function pickTranslatableFields(entityType, formValues = {}) {
  const allowed = FIELD_MAP[entityType] ?? [];
  return allowed.reduce((accumulator, key) => {
    const value = formValues[key];
    if (value !== undefined && value !== null) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

export function getFieldOrder(entityType) {
  return FIELD_MAP[entityType] ?? [];
}
