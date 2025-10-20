import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Badge, Modal, TextInput } from 'flowbite-react';
import { Link } from 'react-router-dom';
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';
import DashboardLayout from './DashboardLayout.jsx';
import DataTable from '../../components/DataTable.jsx';
import { listarPosts, eliminarPost } from '../../services/posts.js';
import { listarCategorias } from '../../services/categories.js';
import { listarTags } from '../../services/tags.js';
import { getPostReactions } from '../../services/api.js';
import toast from 'react-hot-toast';
import { useUIStore, selectIsDark } from '../../store/useUI';

const PAGE_SIZE = 10;

const createFilterSelectStyles = (isDarkMode) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.7)' : 'transparent',
    borderColor: state.isFocused
      ? 'rgb(14 165 233 / 0.8)'
      : isDarkMode
        ? 'rgba(71, 85, 105, 0.8)'
        : 'rgb(226 232 240)',
    boxShadow: state.isFocused ? '0 0 0 2px rgb(14 165 233 / 0.25)' : 'none',
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.95)' : 'white',
    zIndex: 40
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'rgb(14 165 233 / 0.25)'
      : state.isFocused
        ? 'rgb(14 165 233 / 0.15)'
        : isDarkMode
          ? 'rgba(15,23,42,0.95)'
          : 'transparent',
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(148 163 184)' : 'rgb(100 116 139)'
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(56,189,248,0.25)' : 'rgb(14 165 233 / 0.15)' 
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(191 219 254)' : provided.color
  })
});

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload?.results) {
    return payload.results;
  }
  if (payload?.data) {
    return payload.data;
  }
  return [];
};

const extractCount = (payload, fallbackLength) => {
  if (typeof payload?.count === 'number') {
    return payload.count;
  }
  return fallbackLength;
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return value;
  }
};

function PostsList() {
  const isDarkMode = useUIStore(selectIsDark);
  const tagFilterStyles = useMemo(() => createFilterSelectStyles(isDarkMode), [isDarkMode]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [reactionsBySlug, setReactionsBySlug] = useState({});

  const fetchTaxonomies = useCallback(async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        listarCategorias(),
        listarTags()
      ]);

      setCategoryOptions(
        normalizeCollection(categoriesResponse).map((category) => ({
          value: category.slug ?? category.id,
          label: category.name ?? category.title ?? 'Sin nombre'
        }))
      );

      const normalizedTags = Array.isArray(tagsResponse) ? tagsResponse : normalizeCollection(tagsResponse);
      setTagOptions(
        normalizedTags.map((tag) => ({
          value: tag.name ?? tag.slug ?? tag,
          label: tag.postsCount
            ? `${tag.name ?? tag.slug ?? tag} (${tag.postsCount})`
            : tag.name ?? tag.slug ?? tag
        }))
      );
    } catch (error) {
      toast.error('No se pudieron cargar categorías y tags.');
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listarPosts({
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        tags: selectedTags.map((tag) => tag.value),
        ordering: '-created_at'
      });

      const items = normalizeCollection(response);
      setPosts(items);
      const total = extractCount(response, items.length);
      setTotalItems(total);
      const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (currentPage >= pageCount) {
        setCurrentPage(pageCount - 1);
      }
    } catch (error) {
      toast.error('No fue posible obtener la lista de posts.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedTags]);

  useEffect(() => {
    fetchTaxonomies();
  }, [fetchTaxonomies]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!Array.isArray(posts) || posts.length === 0) {
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    const fetchReactions = async () => {
      const slugs = posts
        .map((post) => post.slug ?? post.id ?? '')
        .filter((slug) => Boolean(slug));
      const pending = slugs.filter((slug) => !reactionsBySlug[slug]);
      if (pending.length === 0) {
        return;
      }
      const results = await Promise.allSettled(
        pending.map((slug) =>
          getPostReactions(slug, { signal: controller.signal })
            .then((summary) => ({ slug, summary }))
            .catch(() => null)
        )
      );
      if (cancelled) {
        return;
      }
      setReactionsBySlug((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.slug && result.value?.summary) {
            next[result.value.slug] = result.value.summary;
          }
        });
        return next;
      });
    };

    fetchReactions();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [posts, reactionsBySlug]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Título',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{row.original.title}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{row.original.slug}</span>
          </div>
        )
      },
      {
        accessorKey: 'categories',
        header: 'Categorías',
        cell: ({ row }) => {
          const categories = row.original.categories_detail ?? row.original.categories ?? [];
          const normalized = Array.isArray(categories)
            ? categories
            : categories
              ? [categories]
              : [];
          if (normalized.length === 0) {
            return <span className="text-sm text-slate-400">Sin categoría</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {normalized.map((category) => {
                const label =
                  typeof category === 'string'
                    ? category
                    : category.name ?? category.title ?? 'Sin categoría';
                return (
                  <Badge key={label} color="gray">
                    {label}
                  </Badge>
                );
              })}
            </div>
          );
        }
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
          const tags = Array.isArray(row.original.tags) ? row.original.tags : [];
          if (tags.length === 0) {
            return <span className="text-sm text-slate-400">Sin etiquetas</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} color="info">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        }
      },
      {
        accessorKey: 'created_at',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(row.original.created_at ?? row.original.created ?? row.original.published_at)}
          </span>
        )
      },
      {
        id: 'reactions',
        header: 'Reacciones',
        cell: ({ row }) => {
          const slug = row.original.slug ?? row.original.id;
          if (!slug) {
            return <span className="text-sm text-slate-400">—</span>;
          }
          const summary = reactionsBySlug[slug];
          if (!summary) {
            return <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" />;
          }
          const breakdown = [
            { type: 'like', emoji: '👍' },
            { type: 'love', emoji: '❤️' },
            { type: 'clap', emoji: '👏' },
            { type: 'wow', emoji: '⚡' },
            { type: 'laugh', emoji: '😄' },
            { type: 'insight', emoji: '💡' }
          ]
            .map((reaction) => `${reaction.emoji} ${summary.counts?.[reaction.type] ?? 0}`)
            .join(' · ');
          return (
            <span
              className="inline-flex min-w-[2.5rem] justify-center rounded-full bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              title={breakdown}
            >
              {summary.total ?? 0}
            </span>
          );
        }
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={`/dashboard/posts/${row.original.slug ?? row.original.id}/edit`}
              color="light"
              size="sm"
              className="flex items-center gap-2"
            >
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              color="failure"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                setPostToDelete(row.original);
                setIsDeleting(true);
              }}
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        )
      }
    ],
    []
  );

  const pagination = useMemo(
    () => ({
      pageIndex: currentPage,
      pageSize: PAGE_SIZE,
      pageCount: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)),
      totalItems,
      onPageChange: setCurrentPage,
      mode: 'server'
    }),
    [currentPage, totalItems]
  );

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await eliminarPost(postToDelete.slug ?? postToDelete.id);
      toast.success('El post se eliminó correctamente.');
      setIsDeleting(false);
      setPostToDelete(null);
      loadPosts();
    } catch (error) {
      toast.error('No se pudo eliminar el post, inténtalo nuevamente.');
    }
  };

  const toolbar = (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex flex-1 items-center gap-3">
          <TextInput
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(0);
            }}
            placeholder="Buscar por título o resumen"
            icon={MagnifyingGlassIcon}
            aria-label="Buscar posts"
            className="w-full"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <select
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setCurrentPage(0);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Todas las categorías</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Select
            isMulti
            value={selectedTags}
            onChange={(value) => {
              setSelectedTags(value ?? []);
              setCurrentPage(0);
            }}
            options={tagOptions}
            placeholder="Filtrar por tags"
            className="w-full"
            classNamePrefix="posts-tag-filter"
            styles={tagFilterStyles}
            aria-label="Filtrar por tags"
            isClearable
          />
        </div>
      </div>
      <Button as={Link} to="/dashboard/posts/new" color="info" className="flex items-center gap-2">
        <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
        Nuevo post
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      title="Gestión de posts"
      description="Administra las publicaciones existentes, crea nuevas y controla su estado."
    >
      <DataTable
        columns={columns}
        data={posts}
        toolbar={toolbar}
        pagination={pagination}
        isLoading={isLoading}
        emptyMessage={isLoading ? ' ' : 'No se encontraron posts con los filtros seleccionados.'}
      />

      <Modal show={isDeleting} size="md" popup onClose={() => setIsDeleting(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <TrashIcon className="mx-auto mb-4 h-12 w-12 text-red-500" aria-hidden="true" />
            <h3 className="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Deseas eliminar este post?
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Esta acción no se puede deshacer y retirará la publicación del sitio.
            </p>
            <div className="flex justify-center gap-4">
              <Button color="gray" onClick={() => setIsDeleting(false)}>
                Cancelar
              </Button>
              <Button color="failure" onClick={handleDelete}>
                Eliminar definitivamente
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </DashboardLayout>
  );
}

export default PostsList;

