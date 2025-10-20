const PICSUM_BASE_URL = 'https://picsum.photos';

const normalizeDimension = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, 2400);
};

const sanitizeSeed = (seed, fallback) => {
  const base = (seed ?? '').toString().trim();
  if (!base) {
    return fallback;
  }
  return base;
};

const buildPicsumUrl = (seed, width, height) => {
  const normalizedSeed = encodeURIComponent(sanitizeSeed(seed, 'codextest-post'));
  const normalizedWidth = normalizeDimension(width, 640);
  const normalizedHeight = normalizeDimension(height, 360);
  return `${PICSUM_BASE_URL}/seed/${normalizedSeed}/${normalizedWidth}/${normalizedHeight}`;
};

export function getPostImage({ image, slug, width = 640, height = 360 }) {
  if (image && typeof image === 'string' && image.trim().length > 0) {
    return image.trim();
  }
  const seed = sanitizeSeed(slug, 'codextest-post');
  return buildPicsumUrl(seed, width, height);
}

export function getHeroImage(seed, width = 1200, height = 600) {
  const normalizedSeed = sanitizeSeed(seed, 'codextest-hero');
  return buildPicsumUrl(`${normalizedSeed}-hero`, width, height);
}

export default {
  getPostImage,
  getHeroImage
};
