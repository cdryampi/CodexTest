import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Badge, Spinner } from 'flowbite-react';
import { Eye, Pencil, Trash2, ListFilter, Undo2, Tag as TagIcon, Search } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import EmptyState from './EmptyState.jsx';
import {
  useDashboardStore,
  selectDashboardPagination,
  selectDashboardSorting
} from '../../store/dashboard.js';

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const statusConfig = {
  published: {
    label: 'Publicado',
    className:
      'inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
  },
  draft: {
    label: 'Borrador',
    className:
      'inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
  },
  scheduled: {
    label: 'Programado',
    className:
      'inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:bg-sky-500/20 dark:text-sky-300'
  }
};

const statuses = [
  { id: 'all', label: 'Todos' },
  { id: 'published', label: 'Publicados' },
  { id: 'draft', label: 'Borradores' },
  { id: 'scheduled', label: 'Programados' }
];

function DataTable({ data, isLoading, onView, onEdit, onDelete }) {
  const search = useDashboardStore((state) => state.search);
  const setSearch = useDashboardStore((state) => state.setSearch);
  const statusFilter = useDashboardStore((state) => state.statusFilter);
  const setStatusFilter = useDashboardStore((state) => state.setStatusFilter);
  const tagFilter = useDashboardStore((state) => state.tagFilter);
  const setTagFilter = useDashboardStore((state) => state.setTagFilter);
  const resetFilters = useDashboardStore((state) => state.resetFilters);
  const density = useDashboardStore((state) => state.density);
  const setDensity = useDashboardStore((state) => state.setDensity);
  const { pageIndex, pageSize } = useDashboardStore(selectDashboardPagination);
  const { sortBy, sortDirection } = useDashboardStore(selectDashboardSorting);
  const setPagination = useDashboardStore((state) => state.setPagination);
  const setSort = useDashboardStore((state) => state.setSort);
  const [sorting, setSorting] = useState(() => [
    { id: sortBy, desc: sortDirection === 'desc' }
  ]);
  const [tableBodyRef] = useAutoAnimate();

  useEffect(() => {
    setSorting([{ id: sortBy, desc: sortDirection === 'desc' }]);
  }, [sortBy, sortDirection]);

  const availableTags = useMemo(() => {
    const tagMap = new Map();
    data.forEach((post) => {
      (post.tags ?? []).forEach((tag) => {
        if (typeof tag !== 'string') return;
        const normalized = tag.trim();
        if (!normalized) return;
        const key = normalized.toLowerCase();
        if (!tagMap.has(key)) {
          tagMap.set(key, normalized);
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [data]);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim();
    return data.filter((post) => {
      const tags = post.tags ?? [];
      const matchesSearch = normalizedSearch
        ? post.title.toLowerCase().includes(normalizedSearch) || tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
        : true;
      const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter;
      const matchesTags =
        tagFilter.length === 0
          ? true
          : tagFilter.every((tag) => tags.map((t) => t.toLowerCase()).includes(tag));
      return matchesSearch && matchesStatus && matchesTags;
    });
  }, [data, search, statusFilter, tagFilter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Título</span>,
        cell: ({ row }) => {
          const original = row.original;
          return (
            <div className="max-w-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">{original.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{original.summary}</p>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</span>,
        cell: ({ row }) => {
          const { status } = row.original;
          const config = statusConfig[status] ?? statusConfig.published;
          return <span className={config.className}>{config.label}</span>;
        }
      },
      {
        accessorKey: 'tags',
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etiquetas</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            {row.original.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} color="info" size="sm" className="rounded-full bg-sky-500/10 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                #{tag}
              </Badge>
            ))}
            {row.original.tags.length > 3 ? (
              <span className="text-xs text-slate-400">+{row.original.tags.length - 3}</span>
            ) : null}
          </div>
        )
      },
      {
        accessorKey: 'publishedAt',
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</span>,
        cell: ({ row }) => {
          const date = new Date(row.original.publishedAt);
          return <span className="text-sm text-slate-500 dark:text-slate-400">{dateFormatter.format(date)}</span>;
        }
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={() => onView(row.original)}
              aria-label={`Ver post ${row.original.title}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={() => onEdit(row.original)}
              aria-label={`Editar post ${row.original.title}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => onDelete(row.original)}
              aria-label={`Eliminar post ${row.original.title}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )
      }
    ],
    [onDelete, onEdit, onView]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize }
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      const primary = next[0];
      if (primary) {
        setSort({ sortBy: primary.id, sortDirection: primary.desc ? 'desc' : 'asc' });
      } else {
        setSort({ sortBy: 'publishedAt', sortDirection: 'desc' });
      }
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      setPagination(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    autoResetPageIndex: false
  });

  useEffect(() => {
    const totalPages = table.getPageCount();
    if (pageIndex > 0 && pageIndex >= totalPages) {
      setPagination({ pageIndex: Math.max(totalPages - 1, 0), pageSize });
    }
  }, [pageIndex, pageSize, setPagination, table]);

  const handleTagToggle = (tag) => {
    const normalized = tag.toLowerCase();
    if (tagFilter.includes(normalized)) {
      setTagFilter(tagFilter.filter((item) => item !== normalized));
    } else {
      setTagFilter([...tagFilter, normalized]);
    }
  };

  const tablePadding = density === 'compact' ? 'py-2 text-sm' : 'py-4';

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <ListFilter className="h-5 w-5" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Listado de posts</h2>
            <p className="text-sm">Filtra por estado, etiquetas o busca por título.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={density === 'comfortable' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setDensity('comfortable')}
          >
            Vista cómoda
          </Button>
          <Button
            type="button"
            variant={density === 'compact' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setDensity('compact')}
          >
            Vista compacta
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Reiniciar filtros
          </Button>
        </div>
      </header>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((status) => (
            <Button
              key={status.id}
              type="button"
              size="sm"
              variant={statusFilter === status.id ? 'secondary' : 'ghost'}
              onClick={() => setStatusFilter(status.id)}
            >
              {status.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título"
            aria-label="Buscar posts"
            className="w-full rounded-full border-slate-200 bg-white pl-10 pr-4 text-sm dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
      </div>
      {availableTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <TagIcon className="h-4 w-4" aria-hidden="true" /> Etiquetas rápidas
          </span>
          {availableTags.map((tag) => {
            const normalized = tag.toLowerCase();
            const isActive = tagFilter.includes(normalized);
            return (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => handleTagToggle(tag)}
              >
                #{tag}
              </Button>
            );
          })}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 shadow-sm dark:border-slate-800/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-900/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-2 text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: '▲',
                            desc: '▼'
                          }[header.column.getIsSorted()] ?? null}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody ref={tableBodyRef} className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Spinner size="lg" />
                      <span>Cargando posts...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`px-6 ${tablePadding}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16">
                    <EmptyState
                      title="Sin posts que mostrar"
                      description="Ajusta los filtros o crea un nuevo post cuando el backend esté disponible."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <div>
          Mostrando {Math.min((pageIndex + 1) * pageSize, filteredData.length)} de {filteredData.length} posts
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span>
            Página {pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </footer>
    </section>
  );
}

DataTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['published', 'draft', 'scheduled']).isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      publishedAt: PropTypes.string.isRequired
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

DataTable.defaultProps = {
  isLoading: false,
  onView: () => {},
  onEdit: () => {},
  onDelete: () => {}
};

export default DataTable;
