import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'flowbite-react';
import slugify from 'slugify';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import {
  useDashboardStore,
  selectTagsState
} from '../../store/dashboard.js';
import { listTags, createTag, updateTag, deleteTag, updateTagTranslation } from '../../services/api.js';
import { Button } from '../../components/ui/button.jsx';
import TranslateButton from '../../components/ai-translate/TranslateButton.jsx';
import TranslateModal from '../../components/ai-translate/TranslateModal.jsx';
import { Input } from '../../components/ui/input.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';

const normalizeName = (value) => value.trim();

const dedupeTags = (tags) => {
  const map = new Map();
  tags.forEach((tag) => {
    if (!tag) return;
    const key = (tag.slug ?? tag.id ?? tag.name ?? '').toString().toLowerCase();
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, { ...tag });
    } else {
      const existing = map.get(key);
      map.set(key, {
        ...existing,
        ...tag,
        usage: Math.max(existing?.usage ?? 0, tag?.usage ?? 0)
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es'));
};

function DashboardTags() {
  const { setHeader } = useDashboardLayout();
  const tagsState = useDashboardStore(selectTagsState);
  const setTagSearch = useDashboardStore((state) => state.setTagSearch);
  const resetTags = useDashboardStore((state) => state.resetTags);

  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, mode: 'create', id: null, slug: null, value: '' });
  const [deleteState, setDeleteState] = useState({ open: false, id: null, name: '', loading: false });
  const [translateModalState, setTranslateModalState] = useState({ open: false, identifier: null });
  const inputRef = useRef(null);

  useEffect(() => {
    setHeader({
      title: 'Etiquetas',
      description: 'Gestiona las etiquetas disponibles para tus publicaciones.',
      showSearch: false,
      actions: (
        <Button type="button" size="sm" onClick={() => setModalState({ open: true, mode: 'create', id: null, value: '' })}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nueva etiqueta
        </Button>
      )
    });
  }, [setHeader]);

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await listTags();
        const normalized = Array.isArray(response)
          ? response
          : [];
        setTags(dedupeTags(normalized));
      } catch (error) {
        toast.error('No pudimos cargar las etiquetas, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    if (!modalState.open) {
      setTranslateModalState({ open: false, identifier: null });
    }
  }, [modalState.open]);

  const filteredTags = useMemo(() => {
    const searchTerm = tagsState.search.trim().toLowerCase();
    if (!searchTerm) {
      return tags;
    }
    return tags.filter((tag) => tag.name?.toLowerCase().includes(searchTerm));
  }, [tags, tagsState.search]);

  const openEditModal = (tag) => {
    setModalState({ open: true, mode: 'edit', id: tag.id ?? tag.slug ?? tag.name, slug: tag.slug ?? tag.id ?? tag.name, value: tag.name ?? '' });
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'create', id: null, slug: null, value: '' });
  };

  const openTranslateAssistant = useCallback(() => {
    if (modalState.mode !== 'edit') {
      toast.info('Guarda la etiqueta antes de traducirla.');
      return;
    }
    const identifier = modalState.id ?? modalState.slug ?? modalState.value;
    if (!identifier) {
      toast.info('Selecciona una etiqueta válida para traducir.');
      return;
    }
    setTranslateModalState({ open: true, identifier });
  }, [modalState.id, modalState.mode, modalState.slug, modalState.value, toast]);

  const handleApplyTranslation = useCallback((lang, translatedFields) => {
    if (!translatedFields || typeof translatedFields !== 'object') {
      return;
    }
    setModalState((prev) => ({
      ...prev,
      value: translatedFields.name ?? prev.value,
      slug: translatedFields.slug ?? prev.slug
    }));
  }, []);

  const handleSaveTranslation = useCallback(async (lang, translatedFields) => {
    const identifier = translateModalState.identifier ?? modalState.id ?? modalState.slug ?? modalState.value;
    if (!identifier) {
      throw new Error('Selecciona una etiqueta existente antes de guardar la traducción.');
    }
    await updateTagTranslation(identifier, lang, translatedFields);
  }, [modalState.id, modalState.slug, modalState.value, translateModalState.identifier]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = normalizeName(modalState.value);
    if (!name) {
      toast.error('El nombre de la etiqueta es obligatorio.');
      return;
    }

    const duplicate = tags.some((tag) => {
      if (!tag?.name) return false;
      const sameName = tag.name.toLowerCase() === name.toLowerCase();
      if (!sameName) return false;
      if (modalState.mode === 'edit') {
        const identifier = modalState.id;
        return tag.id !== identifier && tag.slug !== identifier && tag.name !== identifier;
      }
      return true;
    });

    if (duplicate) {
      toast.error('Ya existe una etiqueta con ese nombre.');
      return;
    }

    try {
      if (modalState.mode === 'edit' && modalState.id) {
        const updated = await updateTag(modalState.id, { name });
        setTags((prev) =>
          dedupeTags(
            prev.map((tag) =>
              tag.id === modalState.id || tag.slug === modalState.id
                ? { ...tag, ...updated, name: updated?.name ?? name }
                : tag
            )
          )
        );
        toast.success('Etiqueta actualizada.');
      } else {
        const created = await createTag({ name });
        setTags((prev) => dedupeTags([{ ...created, name: created?.name ?? name }, ...prev]));
        toast.success('Etiqueta creada.');
      }
      closeModal();
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar la etiqueta.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteState.id) {
      return;
    }
    setDeleteState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteTag(deleteState.id);
      setTags((prev) => dedupeTags(prev.filter((tag) => tag.id !== deleteState.id && tag.slug !== deleteState.id)));
      toast.success('Etiqueta eliminada.');
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo eliminar la etiqueta.');
    } finally {
      setDeleteState({ open: false, id: null, name: '', loading: false });
    }
  };

  const computedSlug = useMemo(
    () => slugify(modalState.value || '', { lower: true, strict: true }),
    [modalState.value]
  );

  const tagTranslationFields = useMemo(
    () => ({
      name: modalState.value ?? '',
      slug: modalState.slug ?? computedSlug ?? ''
    }),
    [modalState.slug, modalState.value, computedSlug]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Buscar etiqueta</span>
            <Input
              type="search"
              value={tagsState.search}
              onChange={(event) => setTagSearch(event.target.value)}
              placeholder="Filtra por nombre"
              aria-label="Buscar etiqueta"
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={resetTags}>
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
                  Uso
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Cargando etiquetas...
                  </td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No se encontraron etiquetas con los criterios indicados.
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.id ?? tag.slug ?? tag.name}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100">{tag.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{tag.slug ?? '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{tag.usage ?? 0}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" size="icon" variant="ghost" onClick={() => openEditModal(tag)} aria-label={`Editar ${tag.name}`}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => setDeleteState({ open: true, id: tag.id ?? tag.slug ?? tag.name, name: tag.name ?? '', loading: false })}
                          aria-label={`Eliminar ${tag.name}`}
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
          {filteredTags.length} etiqueta(s) de {tags.length} disponibles.
        </p>
      </div>

      <Modal
        show={modalState.open}
        size="md"
        onClose={closeModal}
        initialFocus={inputRef.current ?? undefined}
        aria-labelledby="tag-modal-title"
      >
        <Modal.Header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="tag-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {modalState.mode === 'edit' ? 'Editar etiqueta' : 'Nueva etiqueta'}
          </h2>
          {modalState.mode === 'edit' ? (
            <TranslateButton
              size="sm"
              onClick={openTranslateAssistant}
              disabled={!modalState.value?.trim()}
              tooltip={!modalState.value?.trim() ? 'Completa el nombre antes de traducir.' : 'Abrir asistente de traducción.'}
            >
              Traducir
            </TranslateButton>
          ) : null}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body className="space-y-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300" htmlFor="tag-name">
              Nombre de la etiqueta
              <Input
                id="tag-name"
                ref={inputRef}
                value={modalState.value}
                onChange={(event) => setModalState((prev) => ({ ...prev, value: event.target.value }))}
                placeholder="Ej. rendimiento"
                autoFocus
                aria-describedby="tag-slug-preview"
              />
            </label>
            <p id="tag-slug-preview" className="text-xs text-slate-500 dark:text-slate-400">
              Slug previsto: {computedSlug || '—'}
            </p>
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {modalState.mode === 'edit' ? 'Guardar cambios' : 'Crear etiqueta'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <TranslateModal
        open={translateModalState.open}
        onOpenChange={(open) => setTranslateModalState((prev) => ({ ...prev, open }))}
        entityType="tag"
        idOrSlug={translateModalState.identifier}
        fields={tagTranslationFields}
        currentLang="es"
        allowSave={Boolean(translateModalState.identifier)}
        onApply={handleApplyTranslation}
        onSave={handleSaveTranslation}
      />
      <ConfirmModal
        open={deleteState.open}
        title="¿Eliminar etiqueta?"
        description={deleteState.name ? `Se eliminará "${deleteState.name}" de la lista.` : null}
        onCancel={() => setDeleteState({ open: false, id: null, name: '', loading: false })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={deleteState.loading}
      />
    </div>
  );
}

export default DashboardTags;
