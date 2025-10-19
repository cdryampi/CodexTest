import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Spinner } from 'flowbite-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboardStore, selectDashboardDensity } from '../../store/dashboard.js';
import EmptyState from './EmptyState.jsx';
import { Button } from '../ui/button.jsx';

function DataTable({
  columns,
  data,
  isLoading,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  renderToolbar,
  emptyState,
  loadingMessage,
  density: densityProp
}) {
  const globalDensity = useDashboardStore(selectDashboardDensity);
  const density = densityProp ?? globalDensity ?? 'comfortable';
  const [tableBodyRef] = useAutoAnimate();

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    onSortingChange,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      if (next.pageIndex !== pageIndex && typeof onPageChange === 'function') {
        onPageChange(next.pageIndex);
      }
      if (next.pageSize !== pageSize && typeof onPageSizeChange === 'function') {
        onPageSizeChange(next.pageSize);
      }
    }
  });

  const totalRows = data.length;
  const tablePadding = density === 'compact' ? 'py-2 text-sm' : 'py-4';

  const paginationLabel = useMemo(() => {
    if (pageCount === 0) {
      return 'Página 1 de 1';
    }
    return `Página ${pageIndex + 1} de ${pageCount}`;
  }, [pageCount, pageIndex]);

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
      {renderToolbar ? <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">{renderToolbar}</div> : null}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 shadow-sm dark:border-slate-800/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800" role="table">
            <thead className="bg-slate-50/80 dark:bg-slate-900/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} role="row">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      role="columnheader"
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
            <tbody
              ref={tableBodyRef}
              className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30"
            >
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Spinner size="lg" />
                      <span>{loadingMessage ?? 'Cargando información...'}</span>
                    </div>
                  </td>
                </tr>
              ) : totalRows > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40" role="row">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`px-6 ${tablePadding}`} role="cell">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16">
                    <EmptyState
                      title={emptyState?.title ?? 'Sin información para mostrar'}
                      description={emptyState?.description ?? 'No encontramos registros con los filtros actuales.'}
                      action={emptyState?.action}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <div>{paginationLabel}</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </Button>
          <span className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {pageIndex + 1} / {Math.max(pageCount, 1)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-2"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </footer>
    </section>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  pageIndex: PropTypes.number,
  pageSize: PropTypes.number,
  pageCount: PropTypes.number,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  sorting: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    desc: PropTypes.bool
  })),
  onSortingChange: PropTypes.func,
  renderToolbar: PropTypes.node,
  emptyState: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.node,
    action: PropTypes.node
  }),
  loadingMessage: PropTypes.node,
  density: PropTypes.oneOf(['comfortable', 'compact'])
};

DataTable.defaultProps = {
  isLoading: false,
  pageIndex: 0,
  pageSize: 10,
  pageCount: 1,
  onPageChange: undefined,
  onPageSizeChange: undefined,
  sorting: [],
  onSortingChange: undefined,
  renderToolbar: null,
  emptyState: undefined,
  loadingMessage: null,
  density: undefined
};

export default DataTable;
