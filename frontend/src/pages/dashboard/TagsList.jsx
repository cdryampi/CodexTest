import { useEffect, useMemo, useState } from 'react';
import { TextInput, Alert } from 'flowbite-react';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/24/outline';
import DashboardLayout from './DashboardLayout.jsx';
import DataTable from '../../components/DataTable.jsx';
import { listarTags } from '../../services/tags.js';
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

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const response = await listarTags();
      const items = normalizeCollection(response);
      setTags(items);
      setFilteredTags(items);
    } catch (error) {
      toast.error('No se pudieron cargar las etiquetas.');
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
        header: 'Slug sugerido',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500 dark:text-slate-400">{row.original.slug ?? '-'}</span>
        )
      },
      {
        accessorKey: 'postsCount',
        header: 'Posts asociados',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600 dark:text-slate-300">{row.original.postsCount ?? 0}</span>
        )
      }
    ],
    []
  );

  const toolbar = (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TextInput
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar etiqueta"
        icon={MagnifyingGlassIcon}
        aria-label="Buscar etiqueta"
        className="w-full sm:max-w-xs"
      />
      <Alert
        color="info"
        icon={TagIcon}
        className="sm:max-w-xl"
      >
        Las etiquetas se generan al crear o editar posts en el backend. Aquí puedes consultar las existentes y cuántos posts las utilizan.
      </Alert>
    </div>
  );

  return (
    <DashboardLayout
      title="Etiquetas detectadas"
      description="Revisa las etiquetas que expone la API. Se actualizan automáticamente a partir de los posts."
    >
      <DataTable
        columns={columns}
        data={filteredTags}
        toolbar={toolbar}
        isLoading={isLoading}
        emptyMessage={isLoading ? ' ' : 'Aún no hay etiquetas registradas en los posts.'}
      />
    </DashboardLayout>
  );
}

export default TagsList;

