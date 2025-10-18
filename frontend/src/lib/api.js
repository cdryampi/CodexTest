import { apiGet, apiPost } from './apiClient';
import postsSeed from '../data/posts.json';
import commentsSeed from '../data/comments.json';

const DEFAULT_PAGE_SIZE = 9;
const COMMENT_STORAGE_PREFIX = 'blog:comments:';

const sanitizeSearchTerm = (value = '') => value.toString().trim().toLowerCase();

const sanitizeTags = (tags = []) => {
  const unique = new Set();
  tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .forEach((tag) => unique.add(tag));
  return Array.from(unique);
};

const safeStorage = {
  get: (key) => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set: (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Ignorar errores de almacenamiento (modo incógnito, etc.).
    }
  }
};

const toISOString = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizePostRecord = (rawPost = {}) => {
  const createdAt = toISOString(rawPost.created_at ?? rawPost.createdAt ?? rawPost.date);
  const tags = ensureArray(rawPost.tags)
    .map((tag) => tag.toString().trim())
    .filter(Boolean);
  const normalizedTags = tags.map((tag) => tag.toLowerCase());

  return {
    id: rawPost.id ?? rawPost.slug ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    slug: rawPost.slug,
    title: rawPost.title ?? 'Publicación sin título',
    excerpt: rawPost.excerpt ?? '',
    content: rawPost.content ?? '',
    created_at: createdAt,
    tags,
    author: rawPost.author ?? 'Equipo React Tailwind Blog',
    image: rawPost.image ?? rawPost.cover ?? null,
    thumbnail: rawPost.thumb ?? rawPost.thumbnail ?? rawPost.image ?? null,
    _normalizedTags: normalizedTags,
    _searchHaystack: [
      rawPost.title ?? '',
      rawPost.excerpt ?? '',
      rawPost.content ?? '',
      normalizedTags.join(' ')
    ]
      .join(' ')
      .toLowerCase()
  };
};

const normalizeCommentRecord = (rawComment = {}, slug = null, postId = null) => {
  const createdAt = toISOString(rawComment.created_at ?? rawComment.createdAt ?? rawComment.date ?? Date.now());

  return {
    id: rawComment.id ?? `${slug ?? 'comment'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    author_name: rawComment.author_name ?? rawComment.author ?? 'Anónimo',
    content: rawComment.content ?? '',
    created_at: createdAt,
    parent: rawComment.parent ?? rawComment.parent_id ?? rawComment.parentId ?? null,
    postSlug: slug ?? rawComment.postSlug ?? null,
    postId: postId ?? rawComment.postId ?? null
  };
};

const seedPosts = ensureArray(postsSeed).map((post) => normalizePostRecord(post));
const postsBySlug = new Map(seedPosts.filter((post) => post.slug).map((post) => [post.slug, post]));
const postsById = new Map(seedPosts.map((post) => [post.id, post]));

const seedComments = ensureArray(commentsSeed)
  .map((comment) => {
    const post = postsById.get(comment.postId);
    const slug = post?.slug ?? null;
    return normalizeCommentRecord(comment, slug, comment.postId);
  })
  .filter((comment) => !!comment.postSlug || !!comment.postId);

const readStoredComments = (slug) => {
  if (!slug) {
    return [];
  }

  const raw = safeStorage.get(`${COMMENT_STORAGE_PREFIX}${slug}`);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((comment) => normalizeCommentRecord(comment, slug))
      .filter((comment) => Boolean(comment.content));
  } catch (error) {
    return [];
  }
};

const persistStoredComments = (slug, comments) => {
  if (!slug) {
    return;
  }

  safeStorage.set(`${COMMENT_STORAGE_PREFIX}${slug}`, JSON.stringify(comments));
};

const sortByCreatedAt = (items = []) =>
  [...items].sort((a, b) => {
    const timeA = new Date(a.created_at ?? 0).getTime();
    const timeB = new Date(b.created_at ?? 0).getTime();
    return timeA - timeB;
  });

const filterPostsBySearch = (posts, term) => {
  if (!term) {
    return posts;
  }
  return posts.filter((post) => post._searchHaystack.includes(term));
};

const filterPostsByTags = (posts, tags) => {
  if (!tags.length) {
    return posts;
  }

  return posts.filter((post) => tags.every((tag) => post._normalizedTags.includes(tag)));
};

const orderPosts = (posts, ordering) => {
  const normalizedOrdering = ordering || '-created_at';

  const sorted = [...posts];

  if (normalizedOrdering === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
  } else {
    const direction = normalizedOrdering.startsWith('-') ? -1 : 1;
    sorted.sort((a, b) => {
      const timeA = new Date(a.created_at ?? 0).getTime();
      const timeB = new Date(b.created_at ?? 0).getTime();
      return (timeA - timeB) * direction;
    });
  }

  return sorted;
};

const paginatePosts = (posts, page, pageSize = DEFAULT_PAGE_SIZE) => {
  const parsedPage = Number(page);
  const parsedSize = Number(pageSize);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const size = Number.isFinite(parsedSize) && parsedSize > 0 ? Math.floor(parsedSize) : DEFAULT_PAGE_SIZE;
  const start = (currentPage - 1) * size;
  const end = start + size;
  const sliced = posts.slice(start, end);

  return {
    results: sliced.map(({ _searchHaystack, _normalizedTags, ...post }) => ({ ...post })),
    count: posts.length,
    next: end < posts.length ? currentPage + 1 : null,
    previous: start > 0 ? currentPage - 1 : null
  };
};

const listPostsFromSeed = ({ page = 1, search = '', ordering = '-created_at', tags = [] } = {}) => {
  const term = sanitizeSearchTerm(search);
  const normalizedTags = sanitizeTags(tags);

  const filtered = filterPostsByTags(filterPostsBySearch(seedPosts, term), normalizedTags);
  const ordered = orderPosts(filtered, ordering);
  return paginatePosts(ordered, page);
};

const getPostFromSeed = (slug) => {
  if (!slug) {
    return null;
  }

  const post = postsBySlug.get(slug);
  if (!post) {
    return null;
  }

  const { _searchHaystack, _normalizedTags, ...rest } = post;
  return { ...rest };
};

const listCommentsFromSeed = (slug) => {
  if (!slug) {
    return [];
  }

  const post = postsBySlug.get(slug);
  if (!post) {
    return [];
  }

  const baseComments = seedComments.filter((comment) => {
    if (comment.postSlug) {
      return comment.postSlug === slug;
    }
    if (comment.postId) {
      return comment.postId === post.id;
    }
    return false;
  });

  const stored = readStoredComments(slug);

  return sortByCreatedAt([...baseComments, ...stored]).map(({ postSlug, postId, ...comment }) => ({ ...comment }));
};

const storeLocalComment = (slug, comment) => {
  if (!slug) {
    return null;
  }

  const stored = readStoredComments(slug);
  const normalized = normalizeCommentRecord(comment, slug);
  const updated = [...stored, normalized].map(({ postSlug, postId, ...item }) => ({ ...item }));
  persistStoredComments(slug, updated);
  const { postSlug, postId, ...publicComment } = normalized;
  return publicComment;
};

let remoteAvailable = true;

export const listPosts = async ({
  page = 1,
  search = '',
  ordering = '-created_at',
  tags = [],
  signal
} = {}) => {
  if (remoteAvailable) {
    try {
      const params = {
        page,
        ordering,
        search: sanitizeSearchTerm(search),
        tags: sanitizeTags(tags).join(',')
      };

      const { data } = await apiGet('/api/posts/', { params, signal });
      const results = Array.isArray(data?.results)
        ? data.results.map((post) => ({ ...normalizePostRecord(post), _searchHaystack: undefined, _normalizedTags: undefined }))
        : [];
      const sanitizedResults = results.map(({ _searchHaystack, _normalizedTags, ...item }) => ({ ...item }));
      return {
        results: sanitizedResults,
        count: typeof data?.count === 'number' ? data.count : sanitizedResults.length,
        next: data?.next ?? null,
        previous: data?.previous ?? null
      };
    } catch (error) {
      remoteAvailable = false;
    }
  }

  return listPostsFromSeed({ page, search, ordering, tags });
};

export const getPost = async (slug, { signal } = {}) => {
  if (!slug) {
    throw new Error('Slug de publicación requerido');
  }

  if (remoteAvailable) {
    try {
      const { data } = await apiGet(`/api/posts/${slug}/`, { signal });
      const normalized = normalizePostRecord(data);
      const { _searchHaystack, _normalizedTags, ...rest } = normalized;
      return rest;
    } catch (error) {
      remoteAvailable = false;
    }
  }

  const post = getPostFromSeed(slug);
  if (!post) {
    const notFoundError = new Error('Publicación no encontrada');
    notFoundError.status = 404;
    throw notFoundError;
  }

  return post;
};

export const listComments = async (slug, { signal } = {}) => {
  if (!slug) {
    return [];
  }

  if (remoteAvailable) {
    try {
      const { data } = await apiGet(`/api/posts/${slug}/comments/`, { signal });
      const remoteComments = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      const normalized = remoteComments.map((comment) => normalizeCommentRecord(comment, slug));
      const stored = readStoredComments(slug);
      return sortByCreatedAt([...normalized, ...stored]).map(({ postSlug, postId, ...comment }) => ({ ...comment }));
    } catch (error) {
      if (error.status === 404) {
        return [];
      }
      remoteAvailable = false;
    }
  }

  return listCommentsFromSeed(slug);
};

export const createComment = async (slug, payload, { signal } = {}) => {
  if (!slug) {
    throw new Error('Slug de publicación requerido');
  }

  const authorName = payload?.author_name?.toString().trim();
  const content = payload?.content?.toString().trim();

  if (!authorName) {
    throw new Error('El nombre del autor es obligatorio.');
  }

  if (!content) {
    throw new Error('El contenido del comentario es obligatorio.');
  }

  if (content.length > 2000) {
    throw new Error('El comentario no puede superar los 2000 caracteres.');
  }

  if (remoteAvailable) {
    try {
      const body = { author_name: authorName, content };
      const { data } = await apiPost(`/api/posts/${slug}/comments/`, { body, signal });
      return data;
    } catch (error) {
      remoteAvailable = false;
    }
  }

  const stored = storeLocalComment(slug, { author_name: authorName, content });
  return { ...stored, isLocalOnly: true };
};
