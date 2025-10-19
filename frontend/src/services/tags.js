import api from './api.js';

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

const normalizeNextUrl = (nextUrl) => {
  if (!nextUrl) {
    return null;
  }

  try {
    const url = new URL(nextUrl);
    return `${url.pathname.replace(/^\//, '')}${url.search}`;
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

