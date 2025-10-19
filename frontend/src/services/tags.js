import api from './api.js';
import { API_BASE_URL } from '../utils/apiBase.js';

const slugifyTag = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const extractPosts = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const API_PATH_PREFIX = (() => {
  if (typeof API_BASE_URL !== 'string') {
    return 'api';
  }

  const trimmed = API_BASE_URL.trim();
  if (!trimmed) {
    return 'api';
  }

  if (/^https?:\/\//iu.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.pathname.replace(/^\/+/u, '').replace(/\/+$|\s+$/u, '');
    } catch (error) {
      return 'api';
    }
  }

  return trimmed.replace(/^\/+/u, '').replace(/\/+$|\s+$/u, '');
})();

const stripApiPrefix = (pathname) => {
  if (!pathname) {
    return '';
  }

  const hasTrailingSlash = pathname.endsWith('/');
  let normalized = pathname.replace(/^\/+/u, '');
  const prefix = API_PATH_PREFIX.toLowerCase();

  if (prefix) {
    const lowered = normalized.toLowerCase();
    if (lowered === prefix) {
      normalized = '';
    } else if (lowered.startsWith(`${prefix}/`)) {
      normalized = normalized.slice(prefix.length + 1);
    }
  }

  if (normalized && hasTrailingSlash && !normalized.endsWith('/')) {
    normalized += '/';
  }

  return normalized;
};

const normalizeNextUrl = (nextUrl) => {
  if (!nextUrl) {
    return null;
  }

  try {
    const url = new URL(nextUrl, API_BASE_URL);
    const pathname = stripApiPrefix(url.pathname);
    const query = url.search ?? '';
    const combined = `${pathname}${query}`;
    return combined.replace(/^\/+/, '') || null;
  } catch (error) {
    return nextUrl.replace(/^\//, '');
  }
};

export async function listarTags() {
  const uniqueTags = new Map();
  let nextPath = 'posts/?page=1&page_size=50';

  while (nextPath) {
    const response = await api.get(nextPath);
    const data = response.data ?? {};
    const posts = extractPosts(data);

    posts.forEach((post) => {
      const tags = Array.isArray(post?.tags) ? post.tags : [];
      tags.forEach((rawTag) => {
        const name = String(rawTag).trim();
        if (!name) {
          return;
        }
        const key = name.toLowerCase();
        if (!uniqueTags.has(key)) {
          uniqueTags.set(key, {
            name,
            slug: slugifyTag(name) || key,
            postsCount: 0
          });
        }
        const tagInfo = uniqueTags.get(key);
        tagInfo.postsCount += 1;
      });
    });

    nextPath = normalizeNextUrl(data.next);
  }

  return Array.from(uniqueTags.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

