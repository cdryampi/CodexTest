import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, TextInput } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, PlusCircleIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DashboardLayout from './DashboardLayout.jsx';
import DataTable from '../../components/DataTable.jsx';
import { listarCategorias, eliminarCategoria } from '../../services/categories.js';
import toast from 'react-hot-toast';

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  if (payload?.data) return payload.data;
  return [];
};

function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await listarCategorias();
      const items = normalizeCollection(response);
      setCategories(items);
      setFilteredCategories(items);
    } catch (error) {
      toast.error('No se pudieron cargar las categorías.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCategories(categories);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredCategories(
      categories.filter((category) =>
        [category.name, category.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lower))
      )
    );
  }, [categories, searchTerm]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {row.original.name ?? 'Sin nombre'}
          </span>
        )
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500 dark:text-slate-400">{row.original.slug ?? '-'}</span>
        )
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={`/dashboard/categories/${row.original.id ?? row.original.slug}/edit`}
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
                setCategoryToDelete(row.original);
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

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await eliminarCategoria(categoryToDelete.id ?? categoryToDelete.slug);
      toast.success('Categoría eliminada correctamente.');
      setIsDeleting(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      toast.error('No se pudo eliminar la categoría.');
    }
  };

  const toolbar = (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TextInput
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar categoría"
        icon={MagnifyingGlassIcon}
        aria-label="Buscar categoría"
        className="w-full sm:max-w-xs"
      />
      <Button as={Link} to="/dashboard/categories/new" color="info" className="flex items-center gap-2">
        <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
        Nueva categoría
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      title="Categorías"
      description="Crea, edita o elimina las categorías disponibles para los posts."
    >
      <DataTable
        columns={columns}
        data={filteredCategories}
        toolbar={toolbar}
        isLoading={isLoading}
        emptyMessage={isLoading ? ' ' : 'No hay categorías registradas.'}
      />

      <Modal show={isDeleting} size="md" popup onClose={() => setIsDeleting(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <TrashIcon className="mx-auto mb-4 h-12 w-12 text-red-500" aria-hidden="true" />
            <h3 className="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Eliminar esta categoría?
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Los posts asociados deberán reasignarse manualmente si el backend lo requiere.
            </p>
            <div className="flex justify-center gap-4">
              <Button color="gray" onClick={() => setIsDeleting(false)}>
                Cancelar
              </Button>
              <Button color="failure" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </DashboardLayout>
  );
}

export default CategoriesList;

