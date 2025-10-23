import { useCallback, useEffect, useMemo, useState, useId } from 'react';
import { Modal, ToggleSwitch, Tooltip } from 'flowbite-react';
import slugify from 'slugify';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { useTranslation } from 'react-i18next';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import {
  useDashboardStore,
  selectCategoriesState
} from '../../store/dashboard.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryTranslation
} from '../../services/api.js';
import { Button } from '../../components/ui/button.jsx';
import TranslateButton from '../../components/ai-translate/TranslateButton.jsx';
import TranslateModal from '../../components/ai-translate/TranslateModal.jsx';
import LanguageFlags from '../../components/ai-translate/LanguageFlags.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';
import { shallow } from 'zustand/shallow';
import useAuthStore from '../../store/auth.js';
import { canManageTaxonomies } from '../../utils/rbac.js';
import { getLoadingPermissionsMessage, getRoleRequirementMessage } from '../../utils/notifications.js';

const TRANSLATION_FIELD_MAP = {
  en: { name: 'name_en', description: 'description_en', slug: 'slug_en' },
  ca: { name: 'name_ca', description: 'description_ca', slug: 'slug_ca' }
};

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

function DashboardCategories() {
  const { t, i18n } = useTranslation();
  const { setHeader } = useDashboardLayout();
  const categoriesState = useDashboardStore(selectCategoriesState);
  const setCategoriesSearch = useDashboardStore((state) => state.setCategoriesSearch);
  const resetCategories = useDashboardStore((state) => state.resetCategories);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLang, setActiveLang] = useState('es');
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    id: null,
    slug: null,
    name: '',
    description: '',
    isActive: true,
    name_en: '',
    description_en: '',
    slug_en: '',
    name_ca: '',
    description_ca: '',
    slug_ca: ''
  });
  const [deleteState, setDeleteState] = useState({ open: false, slug: null, name: '', loading: false });
  const [translateModalState, setTranslateModalState] = useState({ open: false, identifier: null, targetLang: 'en' });

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
      description: '',
      isActive: true,
      name_en: '',
      description_en: '',
      slug_en: '',
      name_ca: '',
      description_ca: '',
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
        {t('dashboard.categories.new')}
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
      title: t('dashboard.categories.title'),
      description: t('dashboard.categories.description'),
      showSearch: false,
      actions: headerActions
    });
  }, [headerActions, setHeader, t]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await listCategories({ withCounts: true });
        const normalized = normalizeCollection(response);
        setCategories(dedupeCategories(normalized));
      } catch (error) {
        toast.error(t('dashboard.categories.errors.fetch'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  useEffect(() => {
    if (!modalState.open) {
      setTranslateModalState({ open: false, identifier: null, targetLang: 'en' });
      setActiveLang('es');
    }
  }, [modalState.open]);

  const filteredCategories = useMemo(() => {
    const searchTerm = categoriesState.search.trim().toLowerCase();
    if (!searchTerm) {
      return categories;
    }
    return categories.filter((category) => category.name?.toLowerCase().includes(searchTerm));
  }, [categories, categoriesState.search]);

  const openEditModal = (category) => {
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      return;
    }
    const translations = category?.translations ?? {};
    setModalState({
      open: true,
      mode: 'edit',
      id: category.id ?? category.slug,
      slug: category.slug,
      name: category.name ?? '',
      description: category.description ?? '',
      isActive: category.is_active !== false,
      name_en: translations?.en?.name ?? '',
      description_en: translations?.en?.description ?? '',
      slug_en: translations?.en?.slug ?? '',
      name_ca: translations?.ca?.name ?? '',
      description_ca: translations?.ca?.description ?? '',
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
      description: '',
      isActive: true,
      name_en: '',
      description_en: '',
      slug_en: '',
      name_ca: '',
      description_ca: '',
      slug_ca: ''
    });
  };

  const openTranslateAssistant = useCallback(() => {
    if (modalState.mode !== 'edit') {
      toast.info(t('dashboard.categories.errors.saveBeforeTranslate'));
      return;
    }
    const identifier = modalState.id ?? modalState.slug;
    if (!identifier) {
      toast.info(t('dashboard.categories.errors.selectValid'));
      return;
    }
    setTranslateModalState({ open: true, identifier, targetLang: activeLang !== 'es' ? activeLang : 'en' });
  }, [modalState.id, modalState.mode, modalState.slug, toast, activeLang, t]);

  const handleChangeField = (field, value) => {
    setModalState((prev) => ({ ...prev, [field]: value }));
  };

  const languageStatuses = useMemo(
    () => ({
      es: modalState.name?.trim() || modalState.description?.trim() ? 'listo' : 'pendiente',
      en: modalState.name_en?.trim() || modalState.description_en?.trim() ? 'listo' : 'pendiente',
      ca: modalState.name_ca?.trim() || modalState.description_ca?.trim() ? 'listo' : 'pendiente'
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
        description: translatedFields.description ?? prev.description,
        slug: translatedFields.slug ?? prev.slug
      }));
      return;
    }
    setModalState((prev) => ({
      ...prev,
      [map.name]: translatedFields.name ?? prev[map.name],
      [map.description]: translatedFields.description ?? prev[map.description],
      [map.slug]: translatedFields.slug ?? prev[map.slug]
    }));
    setActiveLang(lang);
  }, []);

  const handleSaveTranslation = useCallback(
    async (lang, translatedFields) => {
      const identifier = translateModalState.identifier ?? modalState.id ?? modalState.slug;
      if (!identifier) {
        throw new Error(t('dashboard.categories.errors.selectValid'));
      }
      const map = TRANSLATION_FIELD_MAP[lang];
      if (!map) {
        throw new Error(t('dashboard.categories.errors.selectTarget'));
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
      await updateCategoryTranslation(identifier, lang, payload);
    },
    [modalState, translateModalState.identifier, t]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      return;
    }
    const name = modalState.name.trim();
    if (!name) {
      toast.error(t('dashboard.categories.errors.requiredName'));
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
      toast.error(t('dashboard.categories.errors.duplicate'));
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
        toast.success(t('dashboard.categories.success.updated'));
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => dedupeCategories([created, ...prev]));
        toast.success(t('dashboard.categories.success.created'));
      }
      closeModal();
    } catch (error) {
      toast.error(error?.message ?? t('dashboard.categories.errors.save'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteState.slug) {
      return;
    }
    if (!authReady || !canManage) {
      toast.error(editorAdminRequirement);
      setDeleteState({ open: false, slug: null, name: '', loading: false });
      return;
    }
    setDeleteState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteCategory(deleteState.slug);
      setCategories((prev) => dedupeCategories(prev.filter((category) => category.slug !== deleteState.slug)));
      toast.success(t('dashboard.categories.success.deleted'));
    } catch (error) {
      toast.error(error?.message ?? t('dashboard.categories.errors.delete'));
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

  const categoryTranslationFields = useMemo(
    () => ({
      name: modalState.name ?? '',
      description: modalState.description ?? '',
      slug: modalState.slug ?? computedSlug ?? ''
    }),
    [modalState.name, modalState.description, modalState.slug, computedSlug]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('dashboard.categories.searchLabel')}</span>
            <Input
              type="search"
              value={categoriesState.search}
              onChange={(event) => setCategoriesSearch(event.target.value)}
              placeholder={t('dashboard.categories.searchPlaceholder')}
              aria-label={t('dashboard.categories.searchAria')}
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={resetCategories}>
            {t('actions.resetFilters')}
          </Button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/70">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-900/70">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.categories.table.name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.categories.table.slug')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.categories.table.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.categories.table.posts')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('dashboard.categories.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.categories.loading')}
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.categories.empty')}
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
                        {category.is_active !== false
                          ? t('dashboard.categories.status.active')
                          : t('dashboard.categories.status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{category.post_count ?? 0}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <GuardedIconButton
                          icon={Pencil}
                          label={t('actions.editItem', { name: category.name })}
                          onClick={() => openEditModal(category)}
                          disabledReason={createDisabledReason}
                          className="h-9 w-9"
                        />
                        <GuardedIconButton
                          icon={Trash2}
                          label={t('actions.deleteItem', { name: category.name })}
                          onClick={() => setDeleteState({ open: true, slug: category.slug, name: category.name, loading: false })}
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
          {t('dashboard.categories.counter', { count: filteredCategories.length, total: categories.length })}
        </p>
      </div>

      <Modal
        show={modalState.open}
        size="lg"
        onClose={closeModal}
        aria-labelledby="category-modal-title"
      >
        <Modal.Header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="category-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {modalState.mode === 'edit' ? t('dashboard.categories.modal.editTitle') : t('dashboard.categories.modal.createTitle')}
          </h2>
          {modalState.mode === 'edit' ? (
            <TranslateButton
              size="sm"
              onClick={openTranslateAssistant}
              disabled={!modalState.name?.trim()}
              tooltip={!modalState.name?.trim() ? t('dashboard.categories.modal.fillName') : undefined}
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
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-name">
                  {t('dashboard.categories.modal.fields.name')}
                  <Input
                    id="category-name"
                    value={modalState.name}
                    onChange={(event) => handleChangeField('name', event.target.value)}
                    placeholder={t('dashboard.categories.modal.placeholders.name')}
                    aria-describedby="category-slug-preview"
                    autoFocus
                  />
                </label>
                <p id="category-slug-preview" className="text-xs text-slate-500 dark:text-slate-400">
                  {t('dashboard.categories.modal.slugPreview', { slug: computedSlug || '—' })}
                </p>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <span>{t('dashboard.categories.modal.fields.active')}</span>
                  <ToggleSwitch
                    checked={modalState.isActive}
                    label=""
                    onChange={(checked) => handleChangeField('isActive', checked)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-description">
                  {t('dashboard.categories.modal.fields.description')}
                  <Textarea
                    id="category-description"
                    value={modalState.description}
                    onChange={(event) => handleChangeField('description', event.target.value)}
                    rows={4}
                    placeholder={t('dashboard.categories.modal.placeholders.description')}
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{t('dashboard.categories.modal.helpers.description')}</span>
                </label>
              </Tabs.Content>

              <Tabs.Content value="en" className="space-y-4 pt-2">
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-name-en">
                  {t('dashboard.categories.modal.fields.nameEn')}
                  <Input
                    id="category-name-en"
                    value={modalState.name_en}
                    onChange={(event) => handleChangeField('name_en', event.target.value)}
                    placeholder={t('dashboard.categories.modal.placeholders.translationName', { lang: 'EN' })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-slug-en">
                  {t('dashboard.categories.modal.fields.slugEn')}
                  <Input
                    id="category-slug-en"
                    value={modalState.slug_en}
                    onChange={(event) => handleChangeField('slug_en', event.target.value)}
                    placeholder="auto-generado"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-description-en">
                  {t('dashboard.categories.modal.fields.descriptionEn')}
                  <Textarea
                    id="category-description-en"
                    value={modalState.description_en}
                    onChange={(event) => handleChangeField('description_en', event.target.value)}
                    rows={4}
                    placeholder={t('dashboard.categories.modal.placeholders.translationDescription', { lang: 'EN' })}
                  />
                </label>
              </Tabs.Content>

              <Tabs.Content value="ca" className="space-y-4 pt-2">
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-name-ca">
                  {t('dashboard.categories.modal.fields.nameCa')}
                  <Input
                    id="category-name-ca"
                    value={modalState.name_ca}
                    onChange={(event) => handleChangeField('name_ca', event.target.value)}
                    placeholder={t('dashboard.categories.modal.placeholders.translationName', { lang: 'CA' })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-slug-ca">
                  {t('dashboard.categories.modal.fields.slugCa')}
                  <Input
                    id="category-slug-ca"
                    value={modalState.slug_ca}
                    onChange={(event) => handleChangeField('slug_ca', event.target.value)}
                    placeholder="auto-generado"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" htmlFor="category-description-ca">
                  {t('dashboard.categories.modal.fields.descriptionCa')}
                  <Textarea
                    id="category-description-ca"
                    value={modalState.description_ca}
                    onChange={(event) => handleChangeField('description_ca', event.target.value)}
                    rows={4}
                    placeholder={t('dashboard.categories.modal.placeholders.translationDescription', { lang: 'CA' })}
                  />
                </label>
              </Tabs.Content>
            </Tabs.Root>
          </Modal.Body>
          <Modal.Footer className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit">{modalState.mode === 'edit' ? t('actions.saveChanges') : t('dashboard.categories.modal.create')}</Button>
          </Modal.Footer>
        </form>
      </Modal>

      <TranslateModal
        open={translateModalState.open}
        onOpenChange={(open) => setTranslateModalState((prev) => ({ ...prev, open }))}
        entityType="category"
        idOrSlug={translateModalState.identifier}
        fields={categoryTranslationFields}
        currentLang="es"
        allowSave={Boolean(translateModalState.identifier)}
        onApply={handleApplyTranslation}
        onSave={handleSaveTranslation}
        preferredTargetLang={translateModalState.targetLang ?? (activeLang !== 'es' ? activeLang : 'en')}
      />
      <ConfirmModal
        open={deleteState.open}
        title={t('dashboard.categories.delete.title')}
        description={deleteState.name ? t('dashboard.categories.delete.description', { name: deleteState.name }) : null}
        onCancel={() => setDeleteState({ open: false, slug: null, name: '', loading: false })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={deleteState.loading}
      />
    </div>
  );
}

export default DashboardCategories;
