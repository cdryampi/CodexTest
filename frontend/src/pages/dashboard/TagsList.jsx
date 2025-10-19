import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, TextInput } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, PlusCircleIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DashboardLayout from './DashboardLayout.jsx';
import DataTable from '../../components/DataTable.jsx';
import { listarTags, eliminarTag } from '../../services/tags.js';
import toast from 'react-hot-toast';

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  if (payload?.data) return payload.data;
  return [];
};

function TagsList() {
  const [tags, setTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const response = await listarTags();
      const items = normalizeCollection(response);
      setTags(items);
      setFilteredTags(items);
    } catch (error) {
      toast.error('No se pudieron cargar los tags.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredTags(tags);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredTags(
      tags.filter((tag) =>
        [tag.name, tag.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lower))
      )
    );
  }, [tags, searchTerm]);

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
              to={`/dashboard/tags/${row.original.id ?? row.original.slug}/edit`}
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
                setTagToDelete(row.original);
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
    if (!tagToDelete) return;
    try {
      await eliminarTag(tagToDelete.id ?? tagToDelete.slug);
      toast.success('Tag eliminado correctamente.');
      setIsDeleting(false);
      setTagToDelete(null);
      loadTags();
    } catch (error) {
      toast.error('No se pudo eliminar el tag.');
    }
  };

  const toolbar = (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TextInput
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar tag"
        icon={MagnifyingGlassIcon}
        aria-label="Buscar tag"
        className="w-full sm:max-w-xs"
      />
      <Button as={Link} to="/dashboard/tags/new" color="info" className="flex items-center gap-2">
        <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
        Nuevo tag
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      title="Tags"
      description="Administra las etiquetas disponibles para los posts."
    >
      <DataTable
        columns={columns}
        data={filteredTags}
        toolbar={toolbar}
        isLoading={isLoading}
        emptyMessage={isLoading ? ' ' : 'No hay tags registrados.'}
      />

      <Modal show={isDeleting} size="md" popup onClose={() => setIsDeleting(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <TrashIcon className="mx-auto mb-4 h-12 w-12 text-red-500" aria-hidden="true" />
            <h3 className="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Eliminar este tag?
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Esta acción no se puede deshacer.
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

export default TagsList;

