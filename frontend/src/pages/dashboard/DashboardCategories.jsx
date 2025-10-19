import { useEffect, useMemo, useState } from 'react';
import { Modal, ToggleSwitch } from 'flowbite-react';
import slugify from 'slugify';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import {
  useDashboardStore,
  selectCategoriesState
} from '../../store/dashboard.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/api.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  if (payload?.data) return payload.data;
  return [];
};

const dedupeCategories = (categories) => {
  const map = new Map();
  categories.forEach((category) => {
    if (!category) return;
    const key = (category.slug ?? category.id ?? category.name ?? '').toString().toLowerCase();
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, { ...category });
    } else {
      const existing = map.get(key);
      map.set(key, {
        ...existing,
        ...category,
        post_count: Math.max(existing?.post_count ?? 0, category?.post_count ?? 0)
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es'));
};

function DashboardCategories() {
  const { setHeader } = useDashboardLayout();
  const categoriesState = useDashboardStore(selectCategoriesState);
  const setCategoriesSearch = useDashboardStore((state) => state.setCategoriesSearch);
  const resetCategories = useDashboardStore((state) => state.resetCategories);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    slug: null,
    name: '',
    description: '',
    isActive: true
  });
  const [deleteState, setDeleteState] = useState({ open: false, slug: null, name: '', loading: false });

  useEffect(() => {
    setHeader({
      title: 'Categorías',
      description: 'Crea y administra las categorías disponibles para el contenido.',
      showSearch: false,
      actions: (
        <Button
          type="button"
          size="sm"
          onClick={() => setModalState({ open: true, mode: 'create', slug: null, name: '', description: '', isActive: true })}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nueva categoría
        </Button>
      )
    });
  }, [setHeader]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await listCategories({ withCounts: true });
        const normalized = normalizeCollection(response);
        setCategories(dedupeCategories(normalized));
      } catch (error) {
        toast.error('No pudimos cargar las categorías, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const searchTerm = categoriesState.search.trim().toLowerCase();
    if (!searchTerm) {
      return categories;
    }
    return categories.filter((category) => category.name?.toLowerCase().includes(searchTerm));
  }, [categories, categoriesState.search]);

  const openEditModal = (category) => {
    setModalState({
      open: true,
      mode: 'edit',
      slug: category.slug,
      name: category.name ?? '',
      description: category.description ?? '',
      isActive: category.is_active !== false
    });
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'create', slug: null, name: '', description: '', isActive: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = modalState.name.trim();
    if (!name) {
      toast.error('El nombre de la categoría es obligatorio.');
      return;
    }
    const duplicate = categories.some((category) => {
      if (!category?.name) return false;
      const sameName = category.name.toLowerCase() === name.toLowerCase();
      if (!sameName) return false;
      if (modalState.mode === 'edit') {
        return category.slug !== modalState.slug;
      }
      return true;
    });

    if (duplicate) {
      toast.error('Ya existe una categoría con ese nombre.');
      return;
    }

    const payload = {
      name,
      description: modalState.description.trim(),
      is_active: modalState.isActive
    };

    try {
      if (modalState.mode === 'edit' && modalState.slug) {
        const updated = await updateCategory(modalState.slug, payload);
        setCategories((prev) =>
          dedupeCategories(
            prev.map((category) =>
              category.slug === modalState.slug
                ? {
                    ...category,
                    ...updated,
                    name: payload.name,
                    description: payload.description,
                    is_active: payload.is_active
                  }
                : category
            )
          )
        );
        toast.success('Categoría actualizada.');
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => dedupeCategories([created, ...prev]));
        toast.success('Categoría creada.');
      }
      closeModal();
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar la categoría.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteState.slug) {
      return;
    }
    setDeleteState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteCategory(deleteState.slug);
      setCategories((prev) => dedupeCategories(prev.filter((category) => category.slug !== deleteState.slug)));
      toast.success('Categoría eliminada.');
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo eliminar la categoría.');
    } finally {
      setDeleteState({ open: false, slug: null, name: '', loading: false });
    }
  };

  const computedSlug = useMemo(() => {
    if (modalState.mode === 'edit') {
      return modalState.slug ?? '';
    }
    return slugify(modalState.name || '', { lower: true, strict: true });
  }, [modalState.mode, modalState.name, modalState.slug]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Buscar categoría</span>
            <Input
              type="search"
              value={categoriesState.search}
              onChange={(event) => setCategoriesSearch(event.target.value)}
              placeholder="Filtra por nombre"
              aria-label="Buscar categoría"
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={resetCategories}>
            Restablecer filtros
          </Button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/70">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-900/70">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Posts asociados
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Cargando categorías...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No se encontraron categorías con los criterios indicados.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.slug ?? category.name}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100">{category.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{category.slug}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                          category.is_active !== false
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}
                      >
                        {category.is_active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{category.post_count ?? 0}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" size="icon" variant="ghost" onClick={() => openEditModal(category)} aria-label={`Editar ${category.name}`}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => setDeleteState({ open: true, slug: category.slug, name: category.name, loading: false })}
                          aria-label={`Eliminar ${category.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filteredCategories.length} categoría(s) de {categories.length} disponibles.
        </p>
      </div>

      <Modal
        show={modalState.open}
        size="lg"
        onClose={closeModal}
        aria-labelledby="category-modal-title"
      >
        <Modal.Header>
          <h2 id="category-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {modalState.mode === 'edit' ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
        </Modal.Header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Modal.Body className="space-y-4">
            <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-name">
              Nombre de la categoría
              <Input
                id="category-name"
                value={modalState.name}
                onChange={(event) => setModalState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nombre de la categoría"
                aria-describedby="category-slug-preview"
                autoFocus
              />
            </label>
            <p id="category-slug-preview" className="text-xs text-slate-500 dark:text-slate-400">
              Slug previsto: {computedSlug || '—'}
            </p>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span>¿Categoría activa?</span>
              <ToggleSwitch
                checked={modalState.isActive}
                label=""
                onChange={(checked) => setModalState((prev) => ({ ...prev, isActive: checked }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-description">
              Descripción
              <Textarea
                id="category-description"
                value={modalState.description}
                onChange={(event) => setModalState((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                placeholder="Descripción opcional de la categoría"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">Esta información ayuda a tu equipo a reutilizar la categoría correctamente.</span>
            </label>
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit">{modalState.mode === 'edit' ? 'Guardar cambios' : 'Crear categoría'}</Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteState.open}
        title="¿Eliminar categoría?"
        description={deleteState.name ? `Se eliminará "${deleteState.name}" del listado.` : null}
        onCancel={() => setDeleteState({ open: false, slug: null, name: '', loading: false })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={deleteState.loading}
      />
    </div>
  );
}

export default DashboardCategories;
