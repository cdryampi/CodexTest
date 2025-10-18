import { apiGet, apiPost } from '../lib/apiClient';
import postsSeed from '../data/posts.json';
import commentsSeed from '../data/comments.json';
import categoriesSeed from '../data/categories.json';

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

const sanitizeCategory = (value = '') => value.toString().trim().toLowerCase();

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

const seededCategories = ensureArray(categoriesSeed)
  .map((category) => normalizeCategoryRecord(category))
  .filter(Boolean);
const seededCategoriesBySlug = new Map(
  seededCategories.map((category) => [category.slug, category])
);

const normalizePostRecord = (rawPost = {}, { categoriesLookup = seededCategoriesBySlug } = {}) => {
  const createdAt = toISOString(rawPost.created_at ?? rawPost.createdAt ?? rawPost.date);

  const tags = ensureArray(rawPost.tags)
    .map((tag) => tag.toString().trim())
    .filter(Boolean);
  const normalizedTags = tags.map((tag) => tag.toLowerCase());

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

  const normalizedCategoryNames = categoriesDetail
    .map((category) => category.name?.toString().trim().toLowerCase())
    .filter(Boolean);

  return {
    id: rawPost.id ?? rawPost.slug ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    slug: rawPost.slug,
    title: rawPost.title ?? 'Publicación sin título',
    excerpt: rawPost.excerpt ?? '',
    content: rawPost.content ?? '',
    created_at: createdAt,
    tags,
    categories: categorySlugs,
    categories_detail: categoriesDetail,
    author: rawPost.author ?? 'Equipo React Tailwind Blog',
    image: rawPost.image ?? rawPost.cover ?? null,
    thumbnail: rawPost.thumb ?? rawPost.thumbnail ?? rawPost.image ?? null,
    _normalizedTags: normalizedTags,
    _normalizedCategories: categorySlugs,
    _searchHaystack: [
      rawPost.title ?? '',
      rawPost.excerpt ?? '',
      rawPost.content ?? '',
      normalizedTags.join(' '),
      normalizedCategoryNames.join(' ')
    ]
      .join(' ')
      .toLowerCase()
  };
};

const normalizeCommentRecord = (rawComment = {}, slug = null, postId = null) => {
  const createdAt = toISOString(
    rawComment.created_at ?? rawComment.createdAt ?? rawComment.date ?? Date.now()
  );

  return {
    id:
      rawComment.id ?? `${slug ?? 'comment'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    author_name: rawComment.author_name ?? rawComment.author ?? 'Anónimo',
    content: rawComment.content ?? '',
    created_at: createdAt,
    parent: rawComment.parent ?? rawComment.parent_id ?? rawComment.parentId ?? null,
    postSlug: slug ?? rawComment.postSlug ?? null,
    postId: postId ?? rawComment.postId ?? null
  };
};

const seedPosts = ensureArray(postsSeed)
  .map((post) => normalizePostRecord(post, { categoriesLookup: seededCategoriesBySlug }));
const postsBySlug = new Map(seedPosts.filter((post) => post.slug).map((post) => [post.slug, post]));
const postsById = new Map(seedPosts.map((post) => [post.id, post]));

const seedComments = ensureArray(commentsSeed)
  .map((comment) => {
    const post = postsById.get(comment.postId);
    const slug = post?.slug ?? null;
    return normalizeCommentRecord(comment, slug, comment.postId);
  })
  .filter((comment) => !!comment.postSlug || !!comment.postId);

const categoryUsage = new Map();
seedPosts.forEach((post) => {
  ensureArray(post._normalizedCategories).forEach((slug) => {
    categoryUsage.set(slug, (categoryUsage.get(slug) ?? 0) + 1);
  });
});

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

const sanitizePost = (post) => {
  const { _searchHaystack, _normalizedTags, _normalizedCategories, ...publicPost } = post;
  return { ...publicPost };
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
    results: sliced.map(sanitizePost),
    count: posts.length,
    next: end < posts.length ? currentPage + 1 : null,
    previous: start > 0 ? currentPage - 1 : null
  };
};

const listPostsFromSeed = ({
  page = 1,
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

  return sanitizePost(post);
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

let remoteAvailable = true;

export const listPosts = async ({
  page = 1,
  search = '',
  ordering = '-date',
  tags = [],
  category = '',
  signal
} = {}) => {
  const normalizedCategory = sanitizeCategory(category);
  const apiOrdering = normalizeOrderingForApi(ordering);
  const localOrdering = normalizeOrderingForSeed(ordering);

  if (remoteAvailable) {
    try {
      const params = {
        page,
        ordering: apiOrdering,
        search: sanitizeSearchTerm(search),
        tags: sanitizeTags(tags).join(',')
      };
      if (normalizedCategory) {
        params.category = normalizedCategory;
      }

      const { data } = await apiGet('/api/posts/', { params, signal });
      const results = Array.isArray(data?.results)
        ? data.results.map((post) => sanitizePost(normalizePostRecord(post)))
        : [];
      return {
        results,
        count: typeof data?.count === 'number' ? data.count : results.length,
        next: data?.next ?? null,
        previous: data?.previous ?? null
      };
    } catch (error) {
      remoteAvailable = false;
    }
  }

  return listPostsFromSeed({
    page,
    search,
    ordering: localOrdering,
    tags,
    category: normalizedCategory
  });
};

export const getPost = async (slug, { signal } = {}) => {
  if (!slug) {
    throw new Error('Slug de publicación requerido');
  }

  if (remoteAvailable) {
    try {
      const { data } = await apiGet(`/api/posts/${slug}/`, { signal });
      return sanitizePost(normalizePostRecord(data));
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
      if (error?.status === 404) {
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

export const getCategories = async ({
  q = '',
  is_active = undefined,
  with_counts = false,
  signal
} = {}) => {
  const searchTerm = q?.toString().trim();

  if (remoteAvailable) {
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

      return {
        results: normalizedItems,
        count: typeof data?.count === 'number' ? data.count : normalizedItems.length,
        next: data?.next ?? null,
        previous: data?.previous ?? null
      };
    } catch (error) {
      remoteAvailable = false;
    }
  }

  return getCategoriesFromSeed({ q: searchTerm ?? '', is_active });
};
