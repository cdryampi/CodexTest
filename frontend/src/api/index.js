import { apiGet, apiPost } from '../lib/apiClient';
import postsSeed from '../data/posts.json';
import commentsSeed from '../data/comments.json';
import categoriesSeed from '../data/categories.json';

/**
 * @typedef {import('./types.js').Category} Category
 * @typedef {import('./types.js').TagName} TagName
 * @typedef {import('./types.js').PostListItem} PostListItem
 * @typedef {import('./types.js').PostDetail} PostDetail
 * @typedef {import('./types.js').Comment} Comment
 * @typedef {import('./types.js').PaginatedResponse<PostListItem>} PostListResponse
 * @typedef {import('./types.js').PaginatedResponse<Category>} CategoryListResponse
 */

/**
 * @typedef {PostDetail & {
 *   _normalizedTags: string[];
 *   _normalizedCategories: string[];
 *   _searchHaystack: string;
 * }} NormalizedPost
 */

/**
 * @typedef {Comment & {
 *   postSlug: string | null;
 *   postId: number | string | null;
 }} NormalizedComment
 */

const DEFAULT_PAGE_SIZE = 9;
const COMMENT_STORAGE_PREFIX = 'blog:comments:';

const sanitizeSearchTerm = (value = '') => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  try {
    return value.toString().trim().toLowerCase();
  } catch (error) {
    return '';
  }
};

const sanitizeTags = (tags = []) => {
  const unique = new Set();
  tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .forEach((tag) => unique.add(tag));
  return Array.from(unique);
};

const sanitizeCategory = (value = '') => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  try {
    return value.toString().trim().toLowerCase();
  } catch (error) {
    return '';
  }
};

const sanitizeSlug = (value = '') => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  try {
    return value.toString().trim();
  } catch (error) {
    return '';
  }
};

const slugify = (value = '') => {
  const text = value?.toString().trim();
  if (!text) {
    return '';
  }

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
};

const resolvePostSlug = (rawPost) => {
  if (rawPost && typeof rawPost === 'object') {
    const candidate = sanitizeSlug(rawPost.slug ?? rawPost.id ?? rawPost.identifier);
    if (candidate) {
      return candidate;
    }

    const fromTitle = slugify(rawPost.title ?? rawPost.name ?? '');
    if (fromTitle) {
      return fromTitle;
    }
  }

  return `post-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const uniqueOriginalTags = (tags = []) => {
  const seen = new Set();
  const result = [];

  tags.forEach((tag) => {
    const original = tag.toString().trim();
    if (!original) {
      return;
    }
    const normalized = original.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    result.push(original);
  });

  return { values: result, normalized: Array.from(seen) };
};

/** @type {(Category & { is_virtual: boolean })} */
const FALLBACK_UNCATEGORIZED = Object.freeze({
  slug: 'sin-categoria',
  name: 'Sin categoría',
  description: 'Publicaciones sin una categoría asignada.',
  is_active: true,
  post_count: 0,
  is_virtual: true
});

const normalizeOrderingForApi = (ordering) => {
  if (ordering == null) {
    return '-date';
  }

  const value = ordering.toString().trim();
  if (!value) {
    return '-date';
  }

  const isDescending = value.startsWith('-');
  const field = isDescending ? value.slice(1) : value;
  if (field === 'created_at') {
    return `${isDescending ? '-' : ''}date`;
  }
  if (field === 'date' || field === 'title') {
    return `${isDescending ? '-' : ''}${field}`;
  }
  return '-date';
};

const normalizeOrderingForSeed = (ordering) => {
  if (ordering == null) {
    return '-created_at';
  }

  const value = ordering.toString().trim();
  if (!value) {
    return '-created_at';
  }

  const isDescending = value.startsWith('-');
  const field = isDescending ? value.slice(1) : value;
  if (field === 'date') {
    return `${isDescending ? '-' : ''}created_at`;
  }
  if (field === 'created_at' || field === 'title') {
    return `${isDescending ? '-' : ''}${field}`;
  }
  return '-created_at';
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

/**
 * @param {unknown} rawCategory
 * @returns {(Category & { is_virtual?: boolean }) | null}
 */
const normalizeCategoryRecord = (rawCategory = {}) => {
  if (rawCategory == null) {
    return null;
  }

  if (typeof rawCategory === 'string') {
    const slug = sanitizeCategory(rawCategory);
    if (!slug) {
      return null;
    }
    const name = rawCategory.toString().trim() || slug;
    return {
      slug,
      name,
      description: '',
      is_active: true,
      post_count: 0
    };
  }

  const slug = sanitizeCategory(
    rawCategory.slug ?? rawCategory.key ?? rawCategory.identifier ?? rawCategory
  );
  if (!slug) {
    return null;
  }

  const nameSource = rawCategory.name ?? rawCategory.title ?? slug;
  const description = rawCategory.description ?? '';
  const isActiveRaw = rawCategory.is_active ?? rawCategory.active ?? true;
  const isActive =
    typeof isActiveRaw === 'boolean'
      ? isActiveRaw
      : typeof isActiveRaw === 'string'
        ? ['true', '1', 'yes'].includes(isActiveRaw.toLowerCase())
        : true;
  const postCountRaw = rawCategory.post_count ?? rawCategory.count ?? rawCategory.posts ?? 0;
  const postCount = Number.isFinite(postCountRaw) ? Number(postCountRaw) : 0;

  return {
    slug,
    name: nameSource.toString().trim() || slug,
    description: description.toString(),
    is_active: isActive,
    post_count: postCount >= 0 ? postCount : 0
  };
};

/** @type {(Category & { is_virtual?: boolean })[]} */
const seededCategories = (() => {
  const normalized = ensureArray(categoriesSeed)
    .map((category) => normalizeCategoryRecord(category))
    .filter(Boolean);

  if (!normalized.some((category) => category.slug === FALLBACK_UNCATEGORIZED.slug)) {
    normalized.push({ ...FALLBACK_UNCATEGORIZED });
  }

  return normalized;
})();
/** @type {Map<string, Category>} */
const seededCategoriesBySlug = new Map(
  seededCategories.map((category) => [category.slug, category])
);

/**
 * @param {any} rawPost
 * @param {{ categoriesLookup?: Map<string, Category> }} [options]
 * @returns {NormalizedPost}
 */
const normalizePostRecord = (rawPost = {}, { categoriesLookup = seededCategoriesBySlug } = {}) => {
  const createdAt = toISOString(rawPost.created_at ?? rawPost.createdAt ?? rawPost.date);
  const updatedAt = toISOString(
    rawPost.updated_at ?? rawPost.updatedAt ?? rawPost.modified ?? rawPost.date ?? createdAt
  );
  const slug = resolvePostSlug(rawPost);
  const identifier = rawPost.id ?? slug ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;

  const { values: tags, normalized: normalizedTags } = uniqueOriginalTags(
    ensureArray(rawPost.tags ?? rawPost.tag_list ?? [])
  );

  const categoriesDetailRaw = ensureArray(
    rawPost.categories_detail ?? rawPost.categoriesDetail ?? []
  );
  let categoriesDetail = categoriesDetailRaw
    .map((category) => normalizeCategoryRecord(category))
    .filter(Boolean);

  const categorySlugsFromDetail = categoriesDetail.map((category) => category.slug);

  const categoriesFromField = ensureArray(rawPost.categories)
    .map((category) => {
      if (typeof category === 'string') {
        return sanitizeCategory(category);
      }
      if (category && typeof category === 'object') {
        if (category.slug) {
          return sanitizeCategory(category.slug);
        }
        if (category.name) {
          return sanitizeCategory(category.name);
        }
      }
      return sanitizeCategory(category);
    })
    .filter(Boolean);

  const categorySlugsSet = new Set([...categorySlugsFromDetail, ...categoriesFromField]);
  if (categorySlugsSet.size === 0) {
    categorySlugsSet.add(FALLBACK_UNCATEGORIZED.slug);
  }

  const categorySlugs = Array.from(categorySlugsSet);

  if (!categoriesDetail.length && categoriesLookup instanceof Map) {
    categoriesDetail = categorySlugs
      .map((slug) => categoriesLookup.get(slug) ?? null)
      .filter(Boolean);
  } else if (categoriesLookup instanceof Map) {
    categoriesDetail = categoriesDetail.map((category) => {
      if (categoriesLookup.has(category.slug)) {
        const fallback = categoriesLookup.get(category.slug);
        return {
          ...fallback,
          ...category,
          name: category.name || fallback.name,
          description: category.description || fallback.description
        };
      }
      return category;
    });
  }

  if (!categoriesDetail.length) {
    const fallbackCategory =
      categoriesLookup instanceof Map && categoriesLookup.has(FALLBACK_UNCATEGORIZED.slug)
        ? categoriesLookup.get(FALLBACK_UNCATEGORIZED.slug)
        : FALLBACK_UNCATEGORIZED;
    categoriesDetail = [{ ...fallbackCategory }];
  }

  const normalizedCategoryNames = categoriesDetail
    .map((category) => category.name?.toString().trim().toLowerCase())
    .filter(Boolean);

  const title = rawPost.title?.toString().trim() || 'Publicación sin título';
  const excerpt = rawPost.excerpt?.toString() ?? '';
  const content = rawPost.content?.toString() ?? '';
  const author = rawPost.author?.toString().trim() || 'Equipo React Tailwind Blog';
  const image = rawPost.image ?? rawPost.cover ?? null;
  const thumb = rawPost.thumb ?? rawPost.thumbnail ?? null;
  const thumbnail = rawPost.thumbnail ?? rawPost.thumb ?? image ?? null;
  const imageAltRaw = rawPost.imageAlt ?? rawPost.image_alt ?? rawPost.image_alt_text ?? null;
  const imageAlt = imageAltRaw ? imageAltRaw.toString().trim() || null : null;

  const searchHaystack = [
    title,
    excerpt,
    content,
    normalizedTags.join(' '),
    normalizedCategoryNames.join(' '),
    author.toLowerCase()
  ]
    .join(' ')
    .toLowerCase();

  return {
    id: identifier,
    slug,
    title,
    excerpt,
    content,
    created_at: createdAt,
    updated_at: updatedAt,
    tags,
    categories: categorySlugs,
    categories_detail: categoriesDetail,
    author,
    image: image ?? null,
    thumb: thumb ?? null,
    thumbnail,
    imageAlt,
    _normalizedTags: normalizedTags,
    _normalizedCategories: categorySlugs,
    _searchHaystack: searchHaystack
  };
};

/**
 * @param {any} rawComment
 * @param {string|null} slug
 * @param {number|string|null} postId
 * @returns {NormalizedComment}
 */
const normalizeCommentRecord = (rawComment = {}, slug = null, postId = null) => {
  const createdAt = toISOString(
    rawComment.created_at ?? rawComment.createdAt ?? rawComment.date ?? Date.now()
  );
  const resolvedSlug = sanitizeSlug(
    slug ?? rawComment.post ?? rawComment.post_slug ?? rawComment.postSlug ?? ''
  );
  const commentPostId = postId ?? rawComment.postId ?? rawComment.post_id ?? null;
  const parentId = rawComment.parent ?? rawComment.parent_id ?? rawComment.parentId ?? null;
  const authorName = rawComment.author_name?.toString().trim()
    || rawComment.author?.toString().trim()
    || 'Anónimo';
  const content = rawComment.content?.toString().trim() ?? '';

  let identifier = rawComment.id ?? rawComment.pk ?? null;
  if (identifier == null) {
    identifier = `${resolvedSlug || 'comment'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  return {
    id: identifier,
    author_name: authorName,
    content,
    created_at: createdAt,
    parent: parentId ?? null,
    postSlug: resolvedSlug || null,
    postId: commentPostId ?? null
  };
};

/** @type {NormalizedPost[]} */
const seedPosts = ensureArray(postsSeed)
  .map((post) => normalizePostRecord(post, { categoriesLookup: seededCategoriesBySlug }));
const postsBySlug = new Map(seedPosts.filter((post) => post.slug).map((post) => [post.slug, post]));
const postsById = new Map(seedPosts.map((post) => [post.id, post]));

/** @type {NormalizedComment[]} */
const seedComments = ensureArray(commentsSeed)
  .map((comment) => {
    const post = postsById.get(comment.postId);
    const slug = post?.slug ?? null;
    return normalizeCommentRecord(comment, slug, comment.postId);
  })
  .filter((comment) => !!comment.postSlug || !!comment.postId);

/** @type {Map<string, number>} */
const categoryUsage = new Map();
seedPosts.forEach((post) => {
  ensureArray(post._normalizedCategories).forEach((slug) => {
    categoryUsage.set(slug, (categoryUsage.get(slug) ?? 0) + 1);
  });
});

/**
 * @param {string} slug
 * @returns {NormalizedComment[]}
 */
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

/**
 * @param {string} slug
 * @param {NormalizedComment[]} comments
 */
const persistStoredComments = (slug, comments) => {
  if (!slug) {
    return;
  }

  safeStorage.set(`${COMMENT_STORAGE_PREFIX}${slug}`, JSON.stringify(comments));
};

/**
 * @template T extends { created_at?: string | null }
 * @param {T[]} items
 * @returns {T[]}
 */
const sortByCreatedAt = (items = []) =>
  [...items].sort((a, b) => {
    const timeA = new Date(a.created_at ?? 0).getTime();
    const timeB = new Date(b.created_at ?? 0).getTime();
    return timeA - timeB;
  });

/**
 * @param {NormalizedPost[]} posts
 * @param {string} term
 * @returns {NormalizedPost[]}
 */
const filterPostsBySearch = (posts, term) => {
  if (!term) {
    return posts;
  }
  return posts.filter((post) => post._searchHaystack.includes(term));
};

/**
 * @param {NormalizedPost[]} posts
 * @param {TagName[]} tags
 * @returns {NormalizedPost[]}
 */
const filterPostsByTags = (posts, tags) => {
  if (!tags.length) {
    return posts;
  }

  return posts.filter((post) => tags.every((tag) => post._normalizedTags.includes(tag)));
};

/**
 * @param {NormalizedPost[]} posts
 * @param {string} category
 * @returns {NormalizedPost[]}
 */
const filterPostsByCategory = (posts, category) => {
  if (!category) {
    return posts;
  }

  const normalized = sanitizeCategory(category);
  if (!normalized) {
    return posts;
  }

  return posts.filter((post) => post._normalizedCategories.includes(normalized));
};

/**
 * @param {NormalizedPost[]} posts
 * @param {string} ordering
 * @returns {NormalizedPost[]}
 */
const orderPosts = (posts, ordering) => {
  const normalizedOrdering = ordering || '-created_at';

  const sorted = [...posts];

  if (normalizedOrdering === 'title' || normalizedOrdering === '-title') {
    const direction = normalizedOrdering.startsWith('-') ? -1 : 1;
    sorted.sort(
      (a, b) => direction * a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })
    );
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

/**
 * @param {NormalizedPost} post
 * @returns {PostDetail}
 */
const sanitizePost = (post) => {
  const { _searchHaystack, _normalizedTags, _normalizedCategories, ...publicPost } = post;
  return { ...publicPost };
};

/**
 * @param {NormalizedPost[]} posts
 * @param {number} page
 * @param {number} [pageSize]
 * @returns {PostListResponse}
 */
const paginatePosts = (posts, page, pageSize = DEFAULT_PAGE_SIZE) => {
  const parsedPage = Number(page);
  const parsedSize = Number(pageSize);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const size = Number.isFinite(parsedSize) && parsedSize > 0 ? Math.floor(parsedSize) : DEFAULT_PAGE_SIZE;
  const start = (currentPage - 1) * size;
  const end = start + size;
  const sliced = posts.slice(start, end);

  return {
    results: sliced.map(sanitizePost),
    count: posts.length,
    next: end < posts.length ? currentPage + 1 : null,
    previous: start > 0 ? currentPage - 1 : null
  };
};

/**
 * @param {{
 *   page?: number;
 *   search?: string;
 *   ordering?: string;
 *   tags?: TagName[];
 *   category?: string;
 * }} params
 * @returns {PostListResponse}
 */
const listPostsFromSeed = ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search = '',
  ordering = '-created_at',
  tags = [],
  category = ''
} = {}) => {
  const normalizedOrdering = normalizeOrderingForSeed(ordering);
  const term = sanitizeSearchTerm(search);
  const normalizedTags = sanitizeTags(tags);
  const normalizedCategory = sanitizeCategory(category);

  const filtered = filterPostsByCategory(
    filterPostsByTags(filterPostsBySearch(seedPosts, term), normalizedTags),
    normalizedCategory
  );
  const ordered = orderPosts(filtered, normalizedOrdering);
  return paginatePosts(ordered, page, pageSize);
};

/**
 * @param {string} slug
 * @returns {PostDetail | null}
 */
const getPostFromSeed = (slug) => {
  if (!slug) {
    return null;
  }

  const post = postsBySlug.get(slug);
  if (!post) {
    return null;
  }

  return sanitizePost(post);
};

/**
 * @param {string} slug
 * @returns {Comment[]}
 */
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

/**
 * @param {string} slug
 * @param {{ author_name: string; content: string }} comment
 * @returns {Comment | null}
 */
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

/**
 * @param {{ q?: string; is_active?: string | boolean }} [params]
 * @returns {CategoryListResponse}
 */
const getCategoriesFromSeed = ({ q = '', is_active = undefined } = {}) => {
  const term = q.toString().trim().toLowerCase();
  const hasTerm = term.length > 0;
  const activeFilter =
    typeof is_active === 'boolean'
      ? is_active
      : typeof is_active === 'string'
        ? ['true', '1', 'yes'].includes(is_active.toLowerCase())
        : undefined;

  const filtered = seededCategories.filter((category) => {
    if (typeof activeFilter === 'boolean' && category.is_active !== activeFilter) {
      return false;
    }
    if (hasTerm) {
      const haystack = [category.name, category.description, category.slug]
        .map((value) => value?.toString().toLowerCase() ?? '')
        .join(' ');
      if (!haystack.includes(term)) {
        return false;
      }
    }
    return true;
  });

  const results = filtered.map((category) => ({
    ...category,
    post_count: categoryUsage.get(category.slug) ?? category.post_count ?? 0
  }));

  return {
    results,
    count: results.length,
    next: null,
    previous: null
  };
};

/**
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   ordering?: string;
 *   tags?: TagName[];
 *   category?: string;
 *   signal?: AbortSignal;
 * }} [params]
 * @returns {Promise<PostListResponse>}
 */
export const listPosts = async ({
  page = 1,
  pageSize = undefined,
  search = '',
  ordering = '-date',
  tags = [],
  category = '',
  signal
} = {}) => {
  const normalizedCategory = sanitizeCategory(category);
  const apiOrdering = normalizeOrderingForApi(ordering);
  const localOrdering = normalizeOrderingForSeed(ordering);

  try {
    const params = {
      page,
      ordering: apiOrdering,
      search: sanitizeSearchTerm(search),
      tags: sanitizeTags(tags).join(',')
    };
    if (Number.isFinite(pageSize) && pageSize > 0) {
      params.page_size = Math.floor(pageSize);
    }
    if (normalizedCategory) {
      params.category = normalizedCategory;
    }

    const { data } = await apiGet('/api/posts/', { params, signal });
    const results = Array.isArray(data?.results)
      ? data.results
          .map((post) => normalizePostRecord(post, { categoriesLookup: seededCategoriesBySlug }))
          .map((post) => sanitizePost(post))
      : [];
    return {
      results,
      count: typeof data?.count === 'number' ? data.count : results.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
  }

  return listPostsFromSeed({
    page,
    pageSize,
    search,
    ordering: localOrdering,
    tags,
    category: normalizedCategory
  });
};

/**
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<PostDetail>}
 */
export const getPost = async (slug, { signal } = {}) => {
  if (!slug) {
    throw new Error('Slug de publicación requerido');
  }

  try {
    const { data } = await apiGet(`/api/posts/${slug}/`, { signal });
    return sanitizePost(normalizePostRecord(data, { categoriesLookup: seededCategoriesBySlug }));
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
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

/**
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Comment[]>}
 */
export const listComments = async (slug, { signal } = {}) => {
  if (!slug) {
    return [];
  }

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
    if (error?.name === 'AbortError') {
      throw error;
    }
    if (error?.status === 404) {
      return [];
    }
  }

  return listCommentsFromSeed(slug);
};

/**
 * @param {string} slug
 * @param {{ author_name?: string; content?: string }} payload
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Comment>}
 */
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

  try {
    const body = { author_name: authorName, content };
    const { data } = await apiPost(`/api/posts/${slug}/comments/`, { body, signal });
    const normalized = normalizeCommentRecord(data, slug);
    const { postSlug, postId, ...comment } = normalized;
    return { ...comment };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
  }

  const stored = storeLocalComment(slug, { author_name: authorName, content });
  return { ...stored, isLocalOnly: true };
};

/**
 * @param {{
 *   q?: string;
 *   is_active?: string | boolean;
 *   with_counts?: boolean;
 *   signal?: AbortSignal;
 * }} [params]
 * @returns {Promise<CategoryListResponse>}
 */
export const getCategories = async ({
  q = '',
  is_active = undefined,
  with_counts = false,
  signal
} = {}) => {
  const searchTerm = q?.toString().trim();

  try {
    const params = {};
    if (searchTerm) {
      params.q = searchTerm;
    }
    if (typeof is_active === 'boolean') {
      params.is_active = is_active ? 'true' : 'false';
    } else if (typeof is_active === 'string' && is_active) {
      params.is_active = is_active;
    }
    if (with_counts) {
      params.with_counts = 'true';
    }

    const { data } = await apiGet('/api/categories/', { params, signal });
    const rawItems = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
        ? data
        : [];
    const normalizedItems = rawItems
      .map((category) => normalizeCategoryRecord(category))
      .filter(Boolean);

    if (!normalizedItems.some((category) => category.slug === FALLBACK_UNCATEGORIZED.slug)) {
      normalizedItems.push({ ...FALLBACK_UNCATEGORIZED });
    }

    return {
      results: normalizedItems,
      count: typeof data?.count === 'number' ? data.count : normalizedItems.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
  }

  return getCategoriesFromSeed({ q: searchTerm ?? '', is_active });
};
