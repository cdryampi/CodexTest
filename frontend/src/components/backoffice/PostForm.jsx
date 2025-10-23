import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import slugify from 'slugify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'sonner';
import * as Tabs from '@radix-ui/react-tabs';
import { useTranslation } from 'react-i18next';
import InputField from '../forms/Input.jsx';
import TextareaField from '../forms/Textarea.jsx';
import SelectField from '../forms/Select.jsx';
import MultiSelectField from '../forms/MultiSelect.jsx';
import { Button } from '../ui/button.jsx';
import TranslateButton from '../ai-translate/TranslateButton.jsx';
import TranslateModal from '../ai-translate/TranslateModal.jsx';
import LanguageFlags from '../ai-translate/LanguageFlags.jsx';
import { Tooltip } from 'flowbite-react';
import {
  listCategories,
  listTags,
  getPost,
  createPost,
  updatePost,
  updatePostTranslation
} from '../../services/api.js';
import { shallow } from 'zustand/shallow';
import useAuthStore from '../../store/auth.js';
import Can from '../rbac/Can.jsx';
import { getLoadingPermissionsMessage, getPermissionRequirementMessage, getRoleRequirementMessage } from '../../utils/notifications.js';
import {
  canCreatePost,
  canEditPost,
  canPublishPost,
  getAuthorRestrictionMessage,
  getScheduleRestrictionMessage
} from '../../utils/rbac.js';

const LANGUAGE_TABS = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés', flag: '🇬🇧' },
  { code: 'ca', label: 'Catalán', flag: '🇨🇦' }
];

const TRANSLATION_FIELD_MAP = {
  en: { title: 'title_en', excerpt: 'excerpt_en', content: 'content_en', slug: 'slug_en' },
  ca: { title: 'title_ca', excerpt: 'excerpt_ca', content: 'content_ca', slug: 'slug_ca' }
};

const tagOptionSchema = z.object({
  value: z.string().trim().min(1, 'El tag no puede estar vacío.'),
  label: z.string()
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const postSchema = z
  .object({
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.').max(120, 'El título es demasiado largo.'),
    slug: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || slugRegex.test(value), 'El slug solo puede contener letras, números y guiones.'),
    excerpt: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? '')
      .refine((value) => !value || value.length <= 280, 'El resumen debe tener 280 caracteres o menos.'),
    content: z.string().min(1, 'El contenido es obligatorio.'),
    category: z.string().optional(),
    tags: z.array(tagOptionSchema).default([]),
    image: z.string().trim().url('La URL de la imagen debe ser válida.'),
    thumb: z.string().trim().url('La URL de la miniatura debe ser válida.'),
    imageAlt: z.string().trim().min(3, 'El texto alternativo debe tener al menos 3 caracteres.'),
    author: z.string().trim().min(3, 'Indica el nombre de la persona autora.'),
    status: z.enum(['published', 'scheduled']).default('published'),
    published_at: z.string().min(1, 'Selecciona una fecha de publicación.'),
    title_en: z.string().optional(),
    slug_en: z.string().optional(),
    excerpt_en: z.string().optional(),
    content_en: z.string().optional(),
    title_ca: z.string().optional(),
    slug_ca: z.string().optional(),
    excerpt_ca: z.string().optional(),
    content_ca: z.string().optional()
  })
  .superRefine((values, ctx) => {
    const plain = values.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
    if (!plain || plain.length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'El contenido debe tener al menos 20 caracteres.'
      });
    }

    if (values.status === 'scheduled') {
      const selectedDate = new Date(values.published_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(selectedDate.getTime()) || selectedDate <= today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['published_at'],
          message: 'Selecciona una fecha futura para programar la publicación.'
        });
      }
    }
  });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ]
};

const defaultValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  title_en: '',
  slug_en: '',
  excerpt_en: '',
  content_en: '',
  title_ca: '',
  slug_ca: '',
  excerpt_ca: '',
  content_ca: '',
  category: '',
  tags: [],
  image: '',
  thumb: '',
  imageAlt: '',
  author: '',
  status: 'published',
  published_at: new Date().toISOString().slice(0, 10)
};

const deriveStatusFromDate = (value) => {
  if (!value) {
    return 'published';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'published';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed > today) {
    return 'scheduled';
  }
  return 'published';
};

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  if (payload?.data) return payload.data;
  return [];
};

function PostForm({ mode, slug, onCancel, onSuccess }) {
  const { t, i18n } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    getValues,
    formState: { isSubmitting, errors }
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentError, setContentError] = useState(null);
  const [translateModalOpen, setTranslateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('es');
  const [postRecord, setPostRecord] = useState(null);

  const saveTooltipId = useId();
  const fallbackSaveTooltipId = useId();

  const { status: authStatus, user: authUser, roles, permissions } = useAuthStore(
    (state) => ({
      status: state.status,
      user: state.user,
      roles: state.roles,
      permissions: state.permissions
    }),
    shallow
  );

  const authContext = useMemo(
    () => ({ user: authUser, roles, permissions }),
    [authUser, permissions, roles]
  );

  const authReady = authStatus === 'ready';
  const permissionsLoading = authStatus === 'loading' || authStatus === 'idle';
  const isEditMode = mode === 'edit';
  const canSubmit = isEditMode
    ? authReady && canEditPost(authContext, postRecord)
    : authReady && canCreatePost(authContext);
  const authorRestrictionMessage = isEditMode ? getAuthorRestrictionMessage(authContext, postRecord) : null;
  const lockFields = isEditMode && authReady && !canEditPost(authContext, postRecord);
  const fieldsReadOnly = lockFields || permissionsLoading;
  const loadingPermissionsMessage = useMemo(() => getLoadingPermissionsMessage(), [i18n.language]);
  const creationRequirement = useMemo(() => getRoleRequirementMessage(['author', 'editor', 'admin']), [i18n.language]);
  const scheduleRestrictionMessage = useMemo(() => getScheduleRestrictionMessage(), [i18n.language]);
  const publishAllowed = authReady && canPublishPost(authContext);
  const publishDisabledReason = permissionsLoading
    ? loadingPermissionsMessage
    : publishAllowed
      ? null
      : scheduleRestrictionMessage;
  const saveDisabledReason = useMemo(() => {
    if (permissionsLoading) {
      return loadingPermissionsMessage;
    }
    if (!canSubmit) {
      if (isEditMode) {
        return authorRestrictionMessage ?? getPermissionRequirementMessage(t('actions.edit'));
      }
      return creationRequirement;
    }
    return null;
  }, [authorRestrictionMessage, canSubmit, creationRequirement, isEditMode, loadingPermissionsMessage, permissionsLoading, t]);
  const restrictionNotice = useMemo(() => {
    if (!isEditMode) {
      return null;
    }
    if (permissionsLoading) {
      return null;
    }
    if (authorRestrictionMessage) {
      return authorRestrictionMessage;
    }
    if (!canSubmit) {
      return getPermissionRequirementMessage(t('actions.edit'));
    }
    return null;
  }, [authorRestrictionMessage, canSubmit, isEditMode, permissionsLoading, t]);

  const renderSaveButton = (reason, forceDisabled = false, tooltipId = saveTooltipId) => {
    const button = (
      <Button type={forceDisabled ? 'button' : 'submit'} disabled={forceDisabled || isSubmitting || Boolean(reason)}>
        {isSubmitting
          ? t('actions.saving')
          : mode === 'edit'
            ? t('actions.saveChanges')
            : t('actions.createPost')}
      </Button>
    );

    if (!reason) {
      return button;
    }

    return (
      <Tooltip content={<span id={tooltipId}>{reason}</span>} trigger="hover" placement="top" style="dark">
        <span aria-describedby={tooltipId} className="inline-flex cursor-not-allowed">
          {button}
        </span>
      </Tooltip>
    );
  };

  const titleValue = watch('title');
  const excerptValue = watch('excerpt');
  const slugValue = watch('slug');
  const contentValue = watch('content');
  const statusValue = watch('status');
  const titleEn = watch('title_en');
  const excerptEn = watch('excerpt_en');
  const contentEn = watch('content_en');
  const titleCa = watch('title_ca');
  const excerptCa = watch('excerpt_ca');
  const contentCa = watch('content_ca');

  const autoSlugRef = useRef('');
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const newSlug = slugify(titleValue ?? '', { lower: true, strict: true });
    const shouldUpdateSlug = !slugValue || slugValue === autoSlugRef.current;
    autoSlugRef.current = newSlug;
    if (shouldUpdateSlug) {
      setValue('slug', newSlug, { shouldDirty: false, shouldValidate: true });
    }
  }, [titleValue, slugValue, setValue]);

  const fetchTaxonomies = useCallback(async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        listCategories({ withCounts: true }),
        listTags()
      ]);

      const categories = normalizeCollection(categoriesResponse).map((category) => ({
        value: category.slug ?? category.id,
        label: category.name ?? category.title ?? 'Sin nombre',
        description: category.description ?? ''
      }));
      setCategoryOptions(categories);

      const normalizedTags = normalizeCollection(tagsResponse).map((tag) => {
        const name = tag.name ?? tag.slug ?? String(tag);
        return {
          value: name,
          label: tag.usage ? `${name} (${tag.usage})` : name
        };
      });
      setTagOptions(normalizedTags);
    } catch (error) {
      toast.error('No fue posible cargar categorías y etiquetas.');
    }
  }, []);

  const populatePost = useCallback(
    async (postSlug) => {
      if (mode !== 'edit' || !postSlug) {
        return;
      }
      try {
        const post = await getPost(postSlug);
        setPostRecord(post ?? null);
        const tagsData = Array.isArray(post?.tags) ? post.tags : [];
        const categoriesData = Array.isArray(post?.categories) ? post.categories : [];
        const translations = post?.translations ?? {};

        const mappedTags = tagsData.map((tag) => ({
          value: typeof tag === 'string' ? tag : tag?.name,
          label: typeof tag === 'string' ? tag : tag?.name
        }));

        const statusFromDate = deriveStatusFromDate(post?.created_at ?? post?.date ?? null);
        const publishedDate = (post?.created_at ?? post?.date ?? new Date().toISOString()).slice(0, 10);

        reset({
          title: post?.title ?? '',
          slug: post?.slug ?? '',
          excerpt: post?.excerpt ?? '',
          content: post?.content ?? '',
          title_en: translations?.en?.title ?? '',
          slug_en: translations?.en?.slug ?? '',
          excerpt_en: translations?.en?.excerpt ?? '',
          content_en: translations?.en?.content ?? '',
          title_ca: translations?.ca?.title ?? '',
          slug_ca: translations?.ca?.slug ?? '',
          excerpt_ca: translations?.ca?.excerpt ?? '',
          content_ca: translations?.ca?.content ?? '',
          category: categoriesData[0] ?? '',
          tags: mappedTags,
          image: post?.image ?? '',
          thumb: post?.thumb ?? '',
          imageAlt: post?.imageAlt ?? '',
          author: post?.author ?? '',
          status: statusFromDate,
          published_at: publishedDate
        });

        setTagOptions((previous) => {
          const map = new Map(previous.map((option) => [option.value.toLowerCase(), option]));
          mappedTags.forEach((option) => {
            if (!map.has(option.value.toLowerCase())) {
              map.set(option.value.toLowerCase(), option);
            }
          });
          return Array.from(map.values());
        });
        return post;
      } catch (error) {
        toast.error('No se pudo cargar el post solicitado.');
        setPostRecord(null);
        if (onCancelRef.current) {
          onCancelRef.current();
        }
      }
    },
    [mode, reset]
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTaxonomies();
      if (mode === 'edit' && slug) {
        await populatePost(slug);
      } else {
        setPostRecord(null);
      }
      setIsLoading(false);
    };

    loadData();
  }, [fetchTaxonomies, mode, populatePost, slug]);

  useEffect(() => {
    const plain = contentValue?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (plain && plain.length >= 20) {
      setContentError(null);
    }
  }, [contentValue]);

  const languageStatuses = useMemo(() => ({
    es: titleValue?.trim() || excerptValue?.trim() || contentValue?.trim() ? 'listo' : 'pendiente',
    en: titleEn?.trim() || excerptEn?.trim() || contentEn?.trim() ? 'listo' : 'pendiente',
    ca: titleCa?.trim() || excerptCa?.trim() || contentCa?.trim() ? 'listo' : 'pendiente'
  }), [titleValue, excerptValue, contentValue, titleEn, excerptEn, contentEn, titleCa, excerptCa, contentCa]);

  const handleApplyTranslation = useCallback(
    (lang, translatedFields) => {
      if (lockFields) {
        return;
      }
      if (!translatedFields || typeof translatedFields !== 'object') {
        return;
      }
      const map = TRANSLATION_FIELD_MAP[lang];
      if (!map) {
        Object.entries(translatedFields).forEach(([key, value]) => {
          if (['title', 'excerpt', 'content', 'slug'].includes(key) && typeof value === 'string') {
            setValue(key, value, { shouldDirty: true, shouldValidate: true });
            if (key === 'content') {
              setContentError(null);
            }
          }
        });
        return;
      }
      Object.entries(map).forEach(([sourceKey, formKey]) => {
        if (translatedFields[sourceKey] !== undefined) {
          setValue(formKey, translatedFields[sourceKey], { shouldDirty: true, shouldValidate: false });
        }
      });
      setActiveTab(lang);
    },
    [lockFields, setActiveTab, setContentError, setValue]
  );

  const handleSaveTranslation = useCallback(async (lang, translatedFields) => {
    if (mode !== 'edit') {
      throw new Error('Debes guardar el post antes de enviar traducciones al backend.');
    }
    if (!canSubmit) {
      throw new Error(getPermissionRequirementMessage(t('actions.edit')));
    }
    const postSlug = (slug ?? slugValue ?? '').trim();
    if (!postSlug) {
      throw new Error('Necesitas un slug válido para guardar la traducción.');
    }
    const map = TRANSLATION_FIELD_MAP[lang];
    if (!map) {
      throw new Error('Selecciona un idioma válido para guardar la traducción.');
    }
    const payload = {};
    Object.entries(map).forEach(([sourceKey, formKey]) => {
      if (translatedFields && Object.prototype.hasOwnProperty.call(translatedFields, sourceKey)) {
        const value = translatedFields[sourceKey];
        if (typeof value === 'string') {
          payload[sourceKey] = value;
          return;
        }
      }
      const currentValue = getValues(formKey);
      if (typeof currentValue === 'string' && currentValue.trim()) {
        payload[sourceKey] = currentValue;
      }
    });
    const categoryValue = getValues('category');
    if (typeof categoryValue === 'string' && categoryValue.trim()) {
      payload.categories = [categoryValue.trim()];
    }
    const selectedTags = getValues('tags');
    if (Array.isArray(selectedTags) && selectedTags.length > 0) {
      const normalizedTags = selectedTags
        .map((tag) => (typeof tag?.value === 'string' ? tag.value.trim() : ''))
        .filter(Boolean);
      if (normalizedTags.length > 0) {
        payload.tags = Array.from(new Set(normalizedTags));
      }
    }
    await updatePostTranslation(postSlug, lang, payload);
  }, [canSubmit, mode, slug, slugValue, getValues]);

  const handleCreateTag = (inputValue) => {
    const value = inputValue.trim();
    if (!value) {
      return;
    }
    const option = { value, label: value };
    setTagOptions((previous) => {
      if (previous.some((item) => item.value.toLowerCase() === value.toLowerCase())) {
        return previous;
      }
      return [...previous, option];
    });
  };

  const onSubmit = async (values) => {
    if (!canSubmit) {
      toast.error(getPermissionRequirementMessage(t('actions.saveChanges')));
      return;
    }
    const payload = {
      title: values.title.trim(),
      slug: values.slug?.trim() ? values.slug.trim() : undefined,
      excerpt: values.excerpt ?? '',
      content: values.content,
      categories: values.category ? [values.category] : [],
      tags: (values.tags ?? []).map((tag) => tag.value),
      image: values.image.trim(),
      thumb: values.thumb.trim(),
      imageAlt: values.imageAlt.trim(),
      author: values.author.trim(),
      date: values.published_at
    };

    try {
      const response = mode === 'edit' ? await updatePost(slug, payload) : await createPost(payload);
      toast.success(mode === 'edit' ? 'Post actualizado correctamente.' : 'Post creado correctamente.');
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      const data = error?.data;
      if (data && typeof data === 'object') {
        let handled = false;
        Object.entries(data).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            handled = true;
            const message = messages[0];
            if (field === 'content') {
              setContentError(message);
            } else if (field === 'date') {
              setError('published_at', { type: 'server', message });
            } else if (field === 'slug') {
              setError('slug', { type: 'server', message });
            } else {
              setError(field, { type: 'server', message });
            }
          }
        });
        if (!handled) {
          toast.error('Revisa los datos del formulario e inténtalo nuevamente.');
        }
      } else {
        toast.error(error?.message ?? 'No se pudo guardar el post.');
      }
    }
  };

  const displayedContentError = errors?.content?.message ?? contentError;
  const translationFields = {
    title: titleValue ?? '',
    excerpt: excerptValue ?? '',
    content: contentValue ?? '',
    slug: slugValue ?? ''
  };
  const postIdentifier = slug ?? slugValue ?? '';

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-slate-400">
        <span className="animate-pulse text-sm">Cargando formulario...</span>
      </div>
    );
  }

  return (
    <>
      {restrictionNotice ? (
        <div className="rounded-3xl border border-amber-400/50 bg-amber-50/60 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100" role="alert">
          {restrictionNotice}
        </div>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('backoffice.post.sections.mainContent')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('backoffice.post.sections.description')}
                </p>
              </div>
              <TranslateButton
                onClick={() => setTranslateModalOpen(true)}
                disabled={fieldsReadOnly || !titleValue?.trim()}
                tooltip={
                  fieldsReadOnly
                    ? 'Este post está en modo solo lectura.'
                    : !titleValue?.trim()
                      ? t('backoffice.post.sections.fillTitle')
                      : undefined
                }
              />
            </div>
            <LanguageFlags selected={activeTab} onSelect={setActiveTab} statuses={languageStatuses} />
          </div>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="sr-only">
              {LANGUAGE_TABS.map((tab) => (
                <Tabs.Trigger key={tab.code} value={tab.code}>
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="es" className="space-y-6 pt-2">
              <div className="grid gap-6 lg:grid-cols-2">
                <InputField
                  control={control}
                  name="title"
                  label={t('backoffice.post.fields.title')}
                  placeholder={t('backoffice.post.placeholders.title')}
                  autoComplete="off"
                  readOnly={fieldsReadOnly}
                />
                <InputField
                  control={control}
                  name="slug"
                  label={t('backoffice.post.fields.slug')}
                  placeholder="auto-generado"
                  helperText={t('backoffice.post.helpers.slug')}
                  autoComplete="off"
                  readOnly={fieldsReadOnly}
                />
              </div>
                <TextareaField
                  control={control}
                  name="excerpt"
                  label={t('backoffice.post.fields.excerpt')}
                  rows={4}
                  placeholder={t('backoffice.post.placeholders.excerpt')}
                  readOnly={fieldsReadOnly}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="post-content">
                    {t('backoffice.post.fields.content')}
                  </label>
                  <ReactQuill
                    id="post-content"
                    theme="snow"
                    value={contentValue}
                    onChange={(value) => setValue('content', value, { shouldDirty: true })}
                    modules={fieldsReadOnly ? { toolbar: false } : quillModules}
                    aria-label={t('backoffice.post.fields.content')}
                    readOnly={fieldsReadOnly}
                  />
                {displayedContentError ? (
                  <p className="text-xs text-red-500">{displayedContentError}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('backoffice.post.helpers.content')}
                  </p>
                )}
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <SelectField
                  control={control}
                  name="category"
                  label={t('backoffice.post.fields.category')}
                  placeholder={t('backoffice.post.placeholders.category')}
                  helperText={t('backoffice.post.helpers.category')}
                  disabled={fieldsReadOnly}
                >
                  <option value="">{t('backoffice.post.placeholders.noCategory')}</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                <MultiSelectField
                  control={control}
                  name="tags"
                  label={t('backoffice.post.fields.tags')}
                  options={tagOptions}
                  placeholder={t('backoffice.post.placeholders.tags')}
                  helperText={t('backoffice.post.helpers.tags')}
                  isCreatable
                  onCreateOption={handleCreateTag}
                  isDisabled={fieldsReadOnly}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <InputField
                  control={control}
                  name="image"
                  label={t('backoffice.post.fields.image')}
                  placeholder="https://..."
                  helperText={t('backoffice.post.helpers.image')}
                  readOnly={fieldsReadOnly}
                />
                <InputField
                  control={control}
                  name="thumb"
                  label={t('backoffice.post.fields.thumbnail')}
                  placeholder="https://..."
                  helperText={t('backoffice.post.helpers.thumbnail')}
                  readOnly={fieldsReadOnly}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <InputField
                  control={control}
                  name="imageAlt"
                  label={t('backoffice.post.fields.imageAlt')}
                  placeholder={t('backoffice.post.placeholders.imageAlt')}
                  readOnly={fieldsReadOnly}
                />
                <InputField
                  control={control}
                  name="author"
                  label={t('backoffice.post.fields.author')}
                  placeholder={t('backoffice.post.placeholders.author')}
                  readOnly={fieldsReadOnly}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <SelectField
                  control={control}
                  name="status"
                  label={t('backoffice.post.fields.status')}
                  helperText={publishDisabledReason ?? t('backoffice.post.helpers.status')}
                  disabled={fieldsReadOnly || !publishAllowed}
                >
                  <option value="published">{t('backoffice.post.status.published')}</option>
                  <option value="scheduled">{t('backoffice.post.status.scheduled')}</option>
                </SelectField>
                <InputField
                  control={control}
                  name="published_at"
                  type="date"
                  label={statusValue === 'scheduled' ? t('backoffice.post.fields.scheduledDate') : t('backoffice.post.fields.publishDate')}
                  disabled={fieldsReadOnly || !publishAllowed}
                />
              </div>
            </Tabs.Content>

            <Tabs.Content value="en" className="space-y-6 pt-2">
              <div className="grid gap-6 lg:grid-cols-2">
                <InputField
                  control={control}
                  name="title_en"
                  label={t('backoffice.post.fields.titleEn')}
                  placeholder={t('backoffice.post.placeholders.translationTitle', { lang: 'EN' })}
                  autoComplete="off"
                  readOnly={fieldsReadOnly}
                />
                <InputField
                  control={control}
                  name="slug_en"
                  label={t('backoffice.post.fields.slugEn')}
                  placeholder="auto-generado"
                  autoComplete="off"
                  readOnly={fieldsReadOnly}
                />
              </div>
              <TextareaField
                control={control}
                name="excerpt_en"
                label={t('backoffice.post.fields.excerptEn')}
                rows={4}
                placeholder={t('backoffice.post.placeholders.translationExcerpt', { lang: 'EN' })}
                readOnly={fieldsReadOnly}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="post-content-en">
                  {t('backoffice.post.fields.contentEn')}
                </label>
                <ReactQuill
                  id="post-content-en"
                  theme="snow"
                  value={contentEn ?? ''}
                  onChange={(value) => setValue('content_en', value, { shouldDirty: true })}
                  modules={fieldsReadOnly ? { toolbar: false } : quillModules}
                  aria-label={t('backoffice.post.fields.contentEn')}
                  readOnly={fieldsReadOnly}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('backoffice.post.helpers.translationEditor')}
                </p>
              </div>
            </Tabs.Content>

            <Tabs.Content value="ca" className="space-y-6 pt-2">
              <div className="grid gap-6 lg:grid-cols-2">
                <InputField
                  control={control}
                  name="title_ca"
                  label={t('backoffice.post.fields.titleCa')}
                  placeholder={t('backoffice.post.placeholders.translationTitle', { lang: 'CA' })}
                  autoComplete="off"
                  readOnly={fieldsReadOnly}
                />
                <InputField
                  control={control}
                  name="slug_ca"
                  label={t('backoffice.post.fields.slugCa')}
                  placeholder="auto-generado"
                  autoComplete="off"
                  readOnly={fieldsReadOnly}
                />
              </div>
              <TextareaField
                control={control}
                name="excerpt_ca"
                label={t('backoffice.post.fields.excerptCa')}
                rows={4}
                placeholder={t('backoffice.post.placeholders.translationExcerpt', { lang: 'CA' })}
                  readOnly={fieldsReadOnly}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="post-content-ca">
                  {t('backoffice.post.fields.contentCa')}
                </label>
                <ReactQuill
                  id="post-content-ca"
                  theme="snow"
                  value={contentCa ?? ''}
                  onChange={(value) => setValue('content_ca', value, { shouldDirty: true })}
                  modules={fieldsReadOnly ? { toolbar: false } : quillModules}
                  aria-label={t('backoffice.post.fields.contentCa')}
                  readOnly={fieldsReadOnly}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('backoffice.post.helpers.translationEditor')}
                </p>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Can
            roles={['admin', 'editor', 'author']}
            permissions={['posts.add_post', 'posts.change_post', 'posts.manage_posts']}
            fallback={renderSaveButton(getPermissionRequirementMessage(t('actions.edit')), true, fallbackSaveTooltipId)}
          >
            {renderSaveButton(saveDisabledReason)}
          </Can>
        </div>
      </form>
      <TranslateModal
        open={translateModalOpen}
        onOpenChange={setTranslateModalOpen}
        entityType="post"
        idOrSlug={postIdentifier || null}
        fields={translationFields}
        currentLang="es"
        allowSave={mode === 'edit' && Boolean(postIdentifier) && !fieldsReadOnly}
        onApply={handleApplyTranslation}
        onSave={mode === 'edit' ? handleSaveTranslation : undefined}
        preferredTargetLang={activeTab !== 'es' ? activeTab : 'en'}
      />
    </>
  );
}

PostForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']),
  slug: PropTypes.string,
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func
};

PostForm.defaultProps = {
  mode: 'create',
  slug: null,
  onCancel: null,
  onSuccess: null
};

export default PostForm;
