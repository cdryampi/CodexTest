import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Table, Spinner, Pagination as FlowbitePagination } from 'flowbite-react';
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

function DataTable({
  columns,
  data,
  toolbar,
  onRowClick,
  emptyMessage = 'No hay datos disponibles.',
  isLoading = false,
  manualSorting = false,
  onSortingChange,
  initialSorting,
  pagination
}) {
  const [localSorting, setLocalSorting] = useState(initialSorting ?? []);

  const sortingState = manualSorting ? initialSorting ?? [] : localSorting;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState
    },
    manualSorting,
    onSortingChange: manualSorting
      ? onSortingChange
      : (updater) => {
          const nextSorting = typeof updater === 'function' ? updater(localSorting) : updater;
          setLocalSorting(nextSorting);
        },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel()
  });

  const isServerPagination = pagination?.mode === 'server';
  const currentPage = pagination?.pageIndex ?? 0;
  const pageSize = pagination?.pageSize ?? data.length;
  const pageCount = pagination?.pageCount ?? 1;

  const pageItems = useMemo(() => {
    if (!pagination || isServerPagination) {
      return table.getRowModel().rows;
    }

    const start = currentPage * pageSize;
    const end = start + pageSize;
    return table.getRowModel().rows.slice(start, end);
  }, [currentPage, pageSize, pagination, table]);

  const visibleColumns = table.getVisibleLeafColumns().length;

  return (
    <div className="flex flex-col gap-4">
      {toolbar ? <div className="flex flex-wrap items-center justify-between gap-3">{toolbar}</div> : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300">
            <Table.Head className="bg-slate-50/80 dark:bg-slate-900/60">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  if (header.isPlaceholder) {
                    return null;
                  }

                  const canSort = header.column.getCanSort();
                  const sorting = header.column.getIsSorted();
                  const SortingIcon = sorting === 'asc' ? ChevronUpIcon : sorting === 'desc' ? ChevronDownIcon : Bars3Icon;

                  return (
                    <Table.HeadCell key={header.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`flex items-center gap-2 rounded-md px-2 py-1 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                          canSort ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'cursor-default'
                        }`}
                        aria-label={
                          canSort
                            ? `Ordenar por ${flexRender(header.column.columnDef.header, header.getContext())}`
                            : undefined
                        }
                        disabled={!canSort}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {canSort ? (
                          <SortingIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        ) : null}
                      </button>
                    </Table.HeadCell>
                  );
                })
              )}
            </Table.Head>
            <Table.Body className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={visibleColumns}
                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
                      <Spinner aria-label="Cargando tabla" />
                      <span>Cargando información...</span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : pageItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={visibleColumns}
                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {emptyMessage}
                  </Table.Cell>
                </Table.Row>
              ) : (
                pageItems.map((row) => (
                  <Table.Row
                    key={row.id}
                    className={`group bg-white transition-colors duration-200 dark:bg-slate-900 ${
                      onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </div>
      {pagination ? (
        <div className="flex items-center justify-end gap-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {pageItems.length > 0 ? currentPage * pageSize + 1 : 0}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentPage * pageSize + pageItems.length}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {pagination.totalItems ?? data.length}
            </span>
          </p>
          <FlowbitePagination
            currentPage={currentPage + 1}
            totalPages={pageCount}
            onPageChange={(page) => pagination.onPageChange?.(page - 1)}
            showIcons
          />
        </div>
      ) : null}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  toolbar: PropTypes.node,
  onRowClick: PropTypes.func,
  emptyMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  manualSorting: PropTypes.bool,
  onSortingChange: PropTypes.func,
  initialSorting: PropTypes.arrayOf(PropTypes.object),
  pagination: PropTypes.shape({
    pageIndex: PropTypes.number,
    pageSize: PropTypes.number,
    pageCount: PropTypes.number,
    onPageChange: PropTypes.func,
    totalItems: PropTypes.number,
    mode: PropTypes.oneOf(['client', 'server'])
  })
};

export default DataTable;

