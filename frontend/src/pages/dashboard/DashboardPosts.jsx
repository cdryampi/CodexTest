import { useCallback, useEffect, useMemo, useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { Tooltip } from 'flowbite-react';
import { shallow } from 'zustand/shallow';
import DataTable from '../../components/backoffice/DataTable.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import {
  useDashboardStore,
  selectPostsState
} from '../../store/dashboard.js';
import {
  listPosts,
  deletePost,
  listCategories,
  listTags
} from '../../services/api.js';
import useAuthStore from '../../store/auth.js';
import {
  canCreatePost,
  canEditPost,
  canDeletePost,
  getAuthorRestrictionMessage
} from '../../utils/rbac.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'scheduled', label: 'Programados' }
];

const ORDER_OPTIONS = [
  { value: '-date', label: 'Más recientes' },
  { value: 'date', label: 'Más antiguos' },
  { value: '-title', label: 'Título Z-A' },
  { value: 'title', label: 'Título A-Z' }
];

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  if (payload?.data) return payload.data;
  return [];
};

const statusBadgeClass = {
  published:
    'inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  scheduled:
    'inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:bg-sky-500/20 dark:text-sky-300'
};

const createTagSelectStyles = (isDarkMode) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.95)',
    borderColor: state.isFocused
      ? 'rgb(14 165 233 / 0.8)'
      : isDarkMode
        ? 'rgba(71, 85, 105, 0.8)'
        : 'rgb(226 232 240)',
    boxShadow: state.isFocused ? '0 0 0 2px rgb(14 165 233 / 0.25)' : 'none',
    borderWidth: '1px',
    minHeight: '44px'
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(56,189,248,0.25)' : 'rgb(14 165 233 / 0.15)',
    color: isDarkMode ? 'rgb(125 211 252)' : 'rgb(14 116 144)'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(191 219 254)' : provided.color
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'rgb(14 165 233 / 0.25)'
      : state.isFocused
        ? 'rgb(14 165 233 / 0.15)'
        : isDarkMode
          ? 'rgba(15,23,42,0.95)'
          : 'white',
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.95)' : 'white',
    zIndex: 30
  }),
  input: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(148 163 184)' : 'rgb(100 116 139)'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  })
});

function GuardedIconButton({ icon: Icon, label, onClick, disabledReason, variant = 'ghost', className }) {
  const tooltipId = useId();
  const button = (
    <Button
      type="button"
      size="icon"
      variant={variant}
      className={className}
      onClick={onClick}
      aria-label={label}
      disabled={Boolean(disabledReason)}
      tabIndex={disabledReason ? -1 : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  if (!disabledReason) {
    return button;
  }

  return (
    <Tooltip content={<span id={tooltipId}>{disabledReason}</span>} trigger="hover" placement="top" style="dark">
      <span aria-describedby={tooltipId} className="inline-flex cursor-not-allowed">
        {button}
      </span>
    </Tooltip>
  );
}

function DashboardPosts() {
  const navigate = useNavigate();
  const { setHeader } = useDashboardLayout();
  const postsState = useDashboardStore(selectPostsState);
  const setPostsStatus = useDashboardStore((state) => state.setPostsStatus);
  const setPostsOrdering = useDashboardStore((state) => state.setPostsOrdering);
  const setPostsPagination = useDashboardStore((state) => state.setPostsPagination);
  const setPostsCategory = useDashboardStore((state) => state.setPostsCategory);
  const setPostsTags = useDashboardStore((state) => state.setPostsTags);
  const resetPosts = useDashboardStore((state) => state.resetPosts);

  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({
    open: false,
    slug: null,
    title: '',
    loading: false,
    post: null
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const { status: authStatus, user: authUser, roles, permissions } = useAuthStore(
    (state) => ({
      status: state.status,
      user: state.user,
      roles: state.roles,
      permissions: state.permissions
    }),
    shallow
  );

  const authContext = useMemo(
    () => ({ user: authUser, roles, permissions }),
    [authUser, permissions, roles]
  );

  const authReady = authStatus === 'ready';
  const canCreate = authReady && canCreatePost(authContext);
  const createTooltipId = useId();

  const isDarkMode = useMemo(
    () => (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false),
    []
  );
  const tagSelectStyles = useMemo(() => createTagSelectStyles(isDarkMode), [isDarkMode]);

  const fetchFilters = useCallback(async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        listCategories({ withCounts: true }),
        listTags()
      ]);
      const normalizedCategories = normalizeCollection(categoriesResponse).map((category) => ({
        value: category.slug ?? category.id,
        label: category.name ?? category.title ?? 'Sin nombre'
      }));
      setCategories(normalizedCategories);

      const normalizedTags = normalizeCollection(tagsResponse).map((tag) => {
        const name = tag.name ?? tag.slug ?? String(tag);
        return {
          value: name,
          label: tag.usage ? `${name} (${tag.usage})` : name
        };
      });
      setTags(normalizedTags);
    } catch (error) {
      toast.error('No fue posible cargar categorías y etiquetas.');
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listPosts({
        page: postsState.page,
        pageSize: postsState.pageSize,
        search: postsState.search,
        ordering: postsState.ordering,
        category: postsState.category || undefined,
        tags: postsState.tags,
        status: postsState.status
      });
      const results = Array.isArray(response?.results) ? response.results : [];
      const count = typeof response?.count === 'number' ? response.count : results.length;
      setPosts(results);
      setTotalCount(count);
      setPageCount(Math.max(Math.ceil(count / postsState.pageSize), 1));
    } catch (error) {
      toast.error('No pudimos cargar los posts, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [postsState.category, postsState.ordering, postsState.page, postsState.pageSize, postsState.search, postsState.status, postsState.tags]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreate = useCallback(() => {
    navigate('/dashboard/posts/new');
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    toast.info('Actualizando listado de posts...');
    fetchPosts();
  }, [fetchPosts]);

  const handleView = useCallback(
    (post) => {
      navigate(`/dashboard/posts/${post.slug}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (post) => {
      navigate(`/dashboard/posts/${post.slug}/edit`);
    },
    [navigate]
  );

  const handleDelete = useCallback((post) => {
    setConfirmState({ open: true, slug: post.slug, title: post.title, loading: false, post });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmState.slug) {
      return;
    }
    if (!authReady || !canDeletePost(authContext, confirmState.post)) {
      toast.error('No tienes permisos para eliminar este post.');
      setConfirmState({ open: false, slug: null, title: '', loading: false, post: null });
      return;
    }
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await deletePost(confirmState.slug);
      toast.success('El post se eliminó correctamente.');
      setConfirmState({ open: false, slug: null, title: '', loading: false, post: null });
      fetchPosts();
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo eliminar el post.');
      setConfirmState({ open: false, slug: null, title: '', loading: false, post: null });
    }
  }, [authContext, authReady, confirmState.post, confirmState.slug, fetchPosts]);

  const pageIndex = postsState.page - 1;

  const createDisabledReason = useMemo(() => {
    if (!authReady) {
      return 'Cargando permisos...';
    }
    if (canCreate) {
      return null;
    }
    return 'Necesitas rol Autor, Editor o Admin.';
  }, [authReady, canCreate]);

  const headerActions = useMemo(() => {
    const createButton = (
      <Button type="button" size="sm" onClick={handleCreate} disabled={Boolean(createDisabledReason)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Nuevo post
      </Button>
    );

    const guardedCreateButton = createDisabledReason ? (
      <Tooltip content={<span id={createTooltipId}>{createDisabledReason}</span>} trigger="hover" placement="top" style="dark">
        <span aria-describedby={createTooltipId} className="inline-flex cursor-not-allowed">
          {createButton}
        </span>
      </Tooltip>
    ) : (
      createButton
    );

    return (
      <div className="flex items-center gap-2">
        {guardedCreateButton}
        <Button type="button" size="sm" variant="ghost" onClick={handleRefresh}>
          Recargar
        </Button>
      </div>
    );
  }, [createDisabledReason, createTooltipId, handleCreate, handleRefresh]);

  useEffect(() => {
    setHeader({
      title: 'Posts',
      description: 'Gestiona el estado de las publicaciones y revisa su actividad.',
      showSearch: true,
      searchPlaceholder: 'Buscar posts por título, tag o categoría',
      actions: headerActions
    });
  }, [headerActions, setHeader]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Título</span>,
        cell: ({ row }) => {
          const original = row.original;
          return (
            <div className="max-w-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">{original.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{original.excerpt}</p>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</span>,
        cell: ({ row }) => {
          const { status } = row.original;
          const badgeClass = statusBadgeClass[status] ?? statusBadgeClass.published;
          const label = status === 'scheduled' ? 'Programado' : 'Publicado';
          return <span className={badgeClass}>{label}</span>;
        }
      },
      {
        accessorKey: 'categories',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Categorías</span>,
        cell: ({ row }) => {
          const categoriesDetail = Array.isArray(row.original.categories_detail)
            ? row.original.categories_detail
            : [];
          if (categoriesDetail.length === 0) {
            return <span className="text-xs text-slate-400">Sin categoría</span>;
          }
          return (
            <div className="flex flex-wrap items-center gap-1">
              {categoriesDetail.slice(0, 2).map((category) => (
                <span
                  key={category.slug ?? category.name}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
                >
                  {category.name ?? category.slug}
                </span>
              ))}
              {categoriesDetail.length > 2 ? (
                <span className="text-xs text-slate-400">+{categoriesDetail.length - 2}</span>
              ) : null}
            </div>
          );
        }
      },
      {
        accessorKey: 'tags',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etiquetas</span>,
        cell: ({ row }) => {
          const tagsList = Array.isArray(row.original.tags) ? row.original.tags : [];
          if (tagsList.length === 0) {
            return <span className="text-xs text-slate-400">Sin tags</span>;
          }
          return (
            <div className="flex flex-wrap items-center gap-1">
              {tagsList.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
                >
                  #{tag}
                </span>
              ))}
              {tagsList.length > 3 ? (
                <span className="text-xs text-slate-400">+{tagsList.length - 3}</span>
              ) : null}
            </div>
          );
        }
      },
      {
        accessorKey: 'created_at',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</span>,
        cell: ({ row }) => {
          const raw = row.original.created_at ?? row.original.date;
          const date = raw ? new Date(raw) : null;
          if (!date || Number.isNaN(date.getTime())) {
            return <span className="text-xs text-slate-400">Sin fecha</span>;
          }
          return (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
                .format(date)
                .replace('.', '')}
            </span>
          );
        }
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original;
          const authorRestriction = authReady ? getAuthorRestrictionMessage(authContext, post) : null;
          const canEdit = authReady && canEditPost(authContext, post);
          const canRemove = authReady && canDeletePost(authContext, post);
          const editDisabledReason = !authReady
            ? 'Cargando permisos...'
            : canEdit
              ? null
              : authorRestriction ?? 'Necesitas rol Editor o Admin.';
          const deleteDisabledReason = !authReady
            ? 'Cargando permisos...'
            : canRemove
              ? null
              : 'Solo editores o administradores pueden eliminar posts.';

          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => handleView(post)}
                aria-label={`Ver post ${post.title}`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
              <GuardedIconButton
                icon={Pencil}
                label={`Editar post ${post.title}`}
                onClick={() => handleEdit(post)}
                disabledReason={editDisabledReason}
                className="h-9 w-9"
              />
              <GuardedIconButton
                icon={Trash2}
                label={`Eliminar post ${post.title}`}
                onClick={() => handleDelete(post)}
                disabledReason={deleteDisabledReason}
                className="h-9 w-9 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              />
            </div>
          );
        }
      }
    ],
    [authContext, authReady, handleDelete, handleEdit, handleView]
  );

  const toggleTagFilter = (tagValue) => {
    if (postsState.tags.includes(tagValue)) {
      setPostsTags(postsState.tags.filter((tag) => tag !== tagValue));
    } else {
      setPostsTags([...postsState.tags, tagValue]);
    }
  };

  const tagOptionsUnion = useMemo(() => {
    const map = new Map();
    tags.forEach((option) => {
      map.set(option.value.toLowerCase(), option);
    });
    (postsState.tags ?? []).forEach((value) => {
      const key = value.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { value, label: value });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [postsState.tags, tags]);

  const selectedTagOptions = useMemo(
    () =>
      tagOptionsUnion.filter((option) =>
        postsState.tags.some((tagValue) => tagValue.toLowerCase() === option.value.toLowerCase())
      ),
    [postsState.tags, tagOptionsUnion]
  );

  const toolbar = (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={postsState.status === option.value ? 'secondary' : 'ghost'}
            onClick={() => setPostsStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={resetPosts}>
          Limpiar filtros
        </Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ordenar por</span>
          <select
            value={postsState.ordering}
            onChange={(event) => setPostsOrdering(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Categoría</span>
          <select
            value={postsState.category}
            onChange={(event) => setPostsCategory(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filtrar por tags</span>
          <Select
            isMulti
            value={selectedTagOptions}
            options={tagOptionsUnion}
            onChange={(selected) => {
              const values = Array.isArray(selected) ? selected.map((option) => option.value) : [];
              setPostsTags(values);
            }}
            placeholder="Selecciona uno o más tags"
            styles={tagSelectStyles}
            classNamePrefix="dashboard-tag-filter"
            closeMenuOnSelect={false}
            isClearable
            noOptionsMessage={() => 'Sin coincidencias'}
            aria-label="Filtrar posts por tags"
          />
        </div>
      </div>
      {tagOptionsUnion.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etiquetas populares</span>
          {tagOptionsUnion.slice(0, 12).map((tag) => {
            const isActive = postsState.tags.some((value) => value.toLowerCase() === tag.value.toLowerCase());
            return (
              <Button
                key={tag.value}
                type="button"
                size="sm"
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => toggleTagFilter(tag.value)}
              >
                #{tag.label.replace(/ \(.*\)$/, '')}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-8">
      <DataTable
        columns={columns}
        data={posts}
        isLoading={isLoading}
        pageIndex={pageIndex}
        pageSize={postsState.pageSize}
        pageCount={pageCount}
        onPageChange={(nextIndex) => setPostsPagination({ page: nextIndex + 1, pageSize: postsState.pageSize })}
        renderToolbar={toolbar}
        loadingMessage="Cargando posts..."
        emptyState={{
          title: 'Sin posts que mostrar',
          description: 'Ajusta los filtros o crea una nueva publicación.',
          action: (
            <Button type="button" onClick={handleCreate}>
              Crear post
            </Button>
          )
        }}
      />
      <ConfirmModal
        open={confirmState.open}
        title="¿Deseas eliminar este post?"
        description={confirmState.title ? `Se eliminará "${confirmState.title}" del backoffice.` : null}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmState({ open: false, slug: null, title: '', loading: false, post: null })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={confirmState.loading}
      />
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Mostrando {posts.length} de {totalCount} resultados
      </div>
    </div>
  );
}

export default DashboardPosts;
