import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { Modal, Tooltip } from 'flowbite-react';
import slugify from 'slugify';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { useTranslation } from 'react-i18next';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import {
  useDashboardStore,
  selectTagsState
} from '../../store/dashboard.js';
import { listTags, createTag, updateTag, deleteTag, updateTagTranslation } from '../../services/api.js';
import { Button } from '../../components/ui/button.jsx';
import TranslateButton from '../../components/ai-translate/TranslateButton.jsx';
import TranslateModal from '../../components/ai-translate/TranslateModal.jsx';
import LanguageFlags from '../../components/ai-translate/LanguageFlags.jsx';
import { Input } from '../../components/ui/input.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';
import { shallow } from 'zustand/shallow';
import useAuthStore from '../../store/auth.js';
import { canManageTaxonomies } from '../../utils/rbac.js';
import { getLoadingPermissionsMessage, getRoleRequirementMessage } from '../../utils/notifications.js';

const TRANSLATION_FIELD_MAP = {
  en: { name: 'name_en', slug: 'slug_en' },
  ca: { name: 'name_ca', slug: 'slug_ca' }
};

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

function GuardedIconButton({ icon: Icon, label, onClick, disabledReason, className }) {
  const tooltipId = useId();
  const button = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
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

function DashboardTags() {
  const { t, i18n } = useTranslation();
  const { setHeader } = useDashboardLayout();
  const tagsState = useDashboardStore(selectTagsState);
  const setTagSearch = useDashboardStore((state) => state.setTagSearch);
  const resetTags = useDashboardStore((state) => state.resetTags);

  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLang, setActiveLang] = useState('es');
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    id: null,
    slug: null,
    name: '',
    name_en: '',
    slug_en: '',
    name_ca: '',
    slug_ca: ''
  });
  const [deleteState, setDeleteState] = useState({ open: false, id: null, name: '', loading: false });
  const [translateModalState, setTranslateModalState] = useState({ open: false, identifier: null, targetLang: 'en' });
  const inputRef = useRef(null);

  const { status: authStatus, roles, permissions } = useAuthStore(
    (state) => ({
      status: state.status,
      roles: state.roles,
      permissions: state.permissions
    }),
    shallow
  );

  const authContext = useMemo(
    () => ({ roles, permissions }),
    [permissions, roles]
  );

  const authReady = authStatus === 'ready';
  const canManage = authReady && canManageTaxonomies(authContext);
  const createTooltipId = useId();

  const loadingPermissionsMessage = useMemo(() => getLoadingPermissionsMessage(), [i18n.language]);
  const editorAdminRequirement = useMemo(() => getRoleRequirementMessage(['editor', 'admin']), [i18n.language]);

  const openCreateModal = useCallback(() => {
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      return;
    }
    setModalState({
      open: true,
      mode: 'create',
      id: null,
      slug: null,
      name: '',
      name_en: '',
      slug_en: '',
      name_ca: '',
      slug_ca: ''
    });
  }, [authReady, canManage, editorAdminRequirement]);

  const createDisabledReason = useMemo(() => {
    if (!authReady) {
      return loadingPermissionsMessage;
    }
    if (canManage) {
      return null;
    }
    return editorAdminRequirement;
  }, [authReady, canManage, editorAdminRequirement, loadingPermissionsMessage]);

  const headerActions = useMemo(() => {
    const createButton = (
      <Button type="button" size="sm" onClick={openCreateModal} disabled={Boolean(createDisabledReason)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('dashboard.tags.new')}
      </Button>
    );

    if (!createDisabledReason) {
      return createButton;
    }

    return (
      <Tooltip content={<span id={createTooltipId}>{createDisabledReason}</span>} trigger="hover" placement="top" style="dark">
        <span aria-describedby={createTooltipId} className="inline-flex cursor-not-allowed">
          {createButton}
        </span>
      </Tooltip>
    );
  }, [createDisabledReason, createTooltipId, openCreateModal, t]);

  useEffect(() => {
    setHeader({
      title: t('dashboard.tags.title'),
      description: t('dashboard.tags.description'),
      showSearch: false,
      actions: headerActions
    });
  }, [headerActions, setHeader, t]);

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await listTags();
        const normalized = Array.isArray(response) ? response : [];
        setTags(dedupeTags(normalized));
      } catch (error) {
        toast.error(t('dashboard.tags.errors.fetch'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [t]);

  useEffect(() => {
    if (!modalState.open) {
      setTranslateModalState({ open: false, identifier: null, targetLang: 'en' });
      setActiveLang('es');
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
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      return;
    }
    const translations = tag?.translations ?? {};
    setModalState({
      open: true,
      mode: 'edit',
      id: tag.id ?? tag.slug ?? tag.name,
      slug: tag.slug ?? tag.id ?? tag.name,
      name: tag.name ?? '',
      name_en: translations?.en?.name ?? '',
      slug_en: translations?.en?.slug ?? '',
      name_ca: translations?.ca?.name ?? '',
      slug_ca: translations?.ca?.slug ?? ''
    });
  };

  const closeModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      id: null,
      slug: null,
      name: '',
      name_en: '',
      slug_en: '',
      name_ca: '',
      slug_ca: ''
    });
  };

  const openTranslateAssistant = useCallback(() => {
    if (modalState.mode !== 'edit') {
      toast.info(t('dashboard.tags.errors.saveBeforeTranslate'));
      return;
    }
    const identifier = modalState.id ?? modalState.slug ?? modalState.name;
    if (!identifier) {
      toast.info(t('dashboard.tags.errors.selectValid'));
      return;
    }
    setTranslateModalState({ open: true, identifier, targetLang: activeLang !== 'es' ? activeLang : 'en' });
  }, [modalState.id, modalState.mode, modalState.slug, modalState.name, toast, activeLang, t]);

  const handleChangeField = (field, value) => {
    setModalState((prev) => ({ ...prev, [field]: value }));
  };

  const languageStatuses = useMemo(
    () => ({
      es: modalState.name?.trim() ? 'listo' : 'pendiente',
      en: modalState.name_en?.trim() ? 'listo' : 'pendiente',
      ca: modalState.name_ca?.trim() ? 'listo' : 'pendiente'
    }),
    [modalState]
  );

  const handleApplyTranslation = useCallback((lang, translatedFields) => {
    if (!translatedFields || typeof translatedFields !== 'object') {
      return;
    }
    const map = TRANSLATION_FIELD_MAP[lang];
    if (!map) {
      setModalState((prev) => ({
        ...prev,
        name: translatedFields.name ?? prev.name,
        slug: translatedFields.slug ?? prev.slug
      }));
      return;
    }
    setModalState((prev) => ({
      ...prev,
      [map.name]: translatedFields.name ?? prev[map.name],
      [map.slug]: translatedFields.slug ?? prev[map.slug]
    }));
    setActiveLang(lang);
  }, []);

  const handleSaveTranslation = useCallback(
    async (lang, translatedFields) => {
      const identifier = translateModalState.identifier ?? modalState.id ?? modalState.slug ?? modalState.name;
      if (!identifier) {
        throw new Error(t('dashboard.tags.errors.selectValid'));
      }
      const map = TRANSLATION_FIELD_MAP[lang];
      if (!map) {
        throw new Error(t('dashboard.tags.errors.selectTarget'));
      }
      const payload = {};
      Object.entries(map).forEach(([key, stateKey]) => {
        if (translatedFields && Object.prototype.hasOwnProperty.call(translatedFields, key)) {
          const value = translatedFields[key];
          if (typeof value === 'string') {
            payload[key] = value;
            return;
          }
        }
        const current = modalState[stateKey];
        if (typeof current === 'string' && current.trim()) {
          payload[key] = current;
        }
      });
      await updateTagTranslation(identifier, lang, payload);
    },
    [modalState, translateModalState.identifier, t]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      return;
    }
    const name = normalizeName(modalState.name);
    if (!name) {
      toast.error(t('dashboard.tags.errors.requiredName'));
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
      toast.error(t('dashboard.tags.errors.duplicate'));
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
        toast.success(t('dashboard.tags.success.updated'));
      } else {
        const created = await createTag({ name });
        setTags((prev) => dedupeTags([{ ...created, name: created?.name ?? name }, ...prev]));
        toast.success(t('dashboard.tags.success.created'));
      }
      closeModal();
    } catch (error) {
      toast.error(error?.message ?? t('dashboard.tags.errors.save'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteState.id) {
      return;
    }
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      setDeleteState({ open: false, id: null, name: '', loading: false });
      return;
    }
    setDeleteState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteTag(deleteState.id);
      setTags((prev) => dedupeTags(prev.filter((tag) => tag.id !== deleteState.id && tag.slug !== deleteState.id)));
      toast.success(t('dashboard.tags.success.deleted'));
    } catch (error) {
      toast.error(error?.message ?? t('dashboard.tags.errors.delete'));
    } finally {
      setDeleteState({ open: false, id: null, name: '', loading: false });
    }
  };

  useEffect(() => {
    if (modalState.open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalState.open]);

  const computedSlug = useMemo(() => {
    if (modalState.mode === 'edit') {
      return modalState.slug ?? '';
    }
    return slugify(modalState.name || '', { lower: true, strict: true });
  }, [modalState.mode, modalState.name, modalState.slug]);

  const tagTranslationFields = useMemo(
    () => ({
      name: modalState.name ?? '',
      slug: modalState.slug ?? computedSlug ?? ''
    }),
    [modalState.name, modalState.slug, computedSlug]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('dashboard.tags.searchLabel')}</span>
            <Input
              type="search"
              value={tagsState.search}
              onChange={(event) => setTagSearch(event.target.value)}
              placeholder={t('dashboard.tags.searchPlaceholder')}
              aria-label={t('dashboard.tags.searchAria')}
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={resetTags}>
            {t('actions.resetFilters')}
          </Button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/70">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-900/70">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.tags.table.name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.tags.table.slug')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.tags.table.usage')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.tags.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.tags.loading')}
                  </td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.tags.empty')}
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.slug ?? tag.name}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100">{tag.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{tag.slug}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{tag.usage ?? 0}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <GuardedIconButton
                          icon={Pencil}
                          label={t('actions.editItem', { name: tag.name })}
                          onClick={() => openEditModal(tag)}
                          disabledReason={createDisabledReason}
                          className="h-9 w-9"
                        />
                        <GuardedIconButton
                          icon={Trash2}
                          label={t('actions.deleteItem', { name: tag.name })}
                          onClick={() => setDeleteState({ open: true, id: tag.id ?? tag.slug ?? tag.name, name: tag.name, loading: false })}
                          disabledReason={createDisabledReason}
                          className="h-9 w-9 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('dashboard.tags.counter', { count: filteredTags.length, total: tags.length })}
        </p>
      </div>

      <Modal
        show={modalState.open}
        size="md"
        onClose={closeModal}
        aria-labelledby="tag-modal-title"
      >
        <Modal.Header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="tag-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {modalState.mode === 'edit' ? t('dashboard.tags.modal.editTitle') : t('dashboard.tags.modal.createTitle')}
          </h2>
          {modalState.mode === 'edit' ? (
            <TranslateButton
              size="sm"
              onClick={openTranslateAssistant}
              disabled={!modalState.name?.trim()}
              tooltip={!modalState.name?.trim() ? t('dashboard.tags.modal.fillName') : undefined}
            />
          ) : null}
        </Modal.Header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Modal.Body className="space-y-4">
            <Tabs.Root value={activeLang} onValueChange={setActiveLang}>
              <Tabs.List className="sr-only">
                {['es', 'en', 'ca'].map((lang) => (
                  <Tabs.Trigger key={lang} value={lang}>
                    {lang}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              <LanguageFlags selected={activeLang} onSelect={setActiveLang} statuses={languageStatuses} />
              <Tabs.Content value="es" className="space-y-4 pt-2">
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="tag-name">
                  {t('dashboard.tags.modal.fields.name')}
                  <Input
                    id="tag-name"
                    ref={inputRef}
                    value={modalState.name}
                    onChange={(event) => handleChangeField('name', event.target.value)}
                    placeholder={t('dashboard.tags.modal.placeholders.name')}
                    aria-describedby="tag-slug-preview"
                  />
                </label>
                <p id="tag-slug-preview" className="text-xs text-slate-500 dark:text-slate-400">
                  {t('dashboard.tags.modal.slugPreview', { slug: computedSlug || '—' })}
                </p>
              </Tabs.Content>

              <Tabs.Content value="en" className="space-y-4 pt-2">
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="tag-name-en">
                  {t('dashboard.tags.modal.fields.nameEn')}
                  <Input
                    id="tag-name-en"
                    value={modalState.name_en}
                    onChange={(event) => handleChangeField('name_en', event.target.value)}
                    placeholder={t('dashboard.tags.modal.placeholders.translationName', { lang: 'EN' })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="tag-slug-en">
                  {t('dashboard.tags.modal.fields.slugEn')}
                  <Input
                    id="tag-slug-en"
                    value={modalState.slug_en}
                    onChange={(event) => handleChangeField('slug_en', event.target.value)}
                    placeholder="auto-generado"
                  />
                </label>
              </Tabs.Content>

              <Tabs.Content value="ca" className="space-y-4 pt-2">
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="tag-name-ca">
                  {t('dashboard.tags.modal.fields.nameCa')}
                  <Input
                    id="tag-name-ca"
                    value={modalState.name_ca}
                    onChange={(event) => handleChangeField('name_ca', event.target.value)}
                    placeholder={t('dashboard.tags.modal.placeholders.translationName', { lang: 'CA' })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="tag-slug-ca">
                  {t('dashboard.tags.modal.fields.slugCa')}
                  <Input
                    id="tag-slug-ca"
                    value={modalState.slug_ca}
                    onChange={(event) => handleChangeField('slug_ca', event.target.value)}
                    placeholder="auto-generado"
                  />
                </label>
              </Tabs.Content>
            </Tabs.Root>
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit">{modalState.mode === 'edit' ? t('actions.saveChanges') : t('dashboard.tags.modal.create')}</Button>
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
        preferredTargetLang={translateModalState.targetLang ?? (activeLang !== 'es' ? activeLang : 'en')}
      />
      <ConfirmModal
        open={deleteState.open}
        title={t('dashboard.tags.delete.title')}
        description={deleteState.name ? t('dashboard.tags.delete.description', { name: deleteState.name }) : null}
        onCancel={() => setDeleteState({ open: false, id: null, name: '', loading: false })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={deleteState.loading}
      />
    </div>
  );
}

export default DashboardTags;
