const toInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const integer = Math.floor(parsed);
  if (integer <= 0) {
    return fallback;
  }
  return integer;
};

const normalizeArray = (input) => {
  if (Array.isArray(input)) {
    return input;
  }
  return [];
};

/**
 * Divide un arreglo en fragmentos del mismo tamaño. Permite definir un tamaño
 * inicial distinto para el primer lote.
 *
 * @template T
 * @param {T[]} input
 * @param {number} size
 * @param {{ initialChunkSize?: number }} [options]
 * @returns {T[][]}
 */
function chunk(input, size, options = {}) {
  const source = normalizeArray(input);
  if (!source.length) {
    return [];
  }

  const normalizedSize = toInteger(size, source.length);
  const initialSize = toInteger(options.initialChunkSize ?? normalizedSize, normalizedSize);

  const result = [];
  let index = 0;

  if (initialSize > 0) {
    result.push(source.slice(0, initialSize));
    index = initialSize;
  }

  while (index < source.length) {
    const end = index + normalizedSize;
    result.push(source.slice(index, end));
    index = end;
  }

  return result;
}

export default chunk;
