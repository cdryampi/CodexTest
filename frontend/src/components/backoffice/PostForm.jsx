import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import slugify from 'slugify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'sonner';
import InputField from '../forms/Input.jsx';
import TextareaField from '../forms/Textarea.jsx';
import SelectField from '../forms/Select.jsx';
import MultiSelectField from '../forms/MultiSelect.jsx';
import { Button } from '../ui/button.jsx';
import {
  listCategories,
  listTags,
  getPost,
  createPost,
  updatePost
} from '../../services/api.js';

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
    published_at: z.string().min(1, 'Selecciona una fecha de publicación.')
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
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { isSubmitting, errors }
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentError, setContentError] = useState(null);

  const titleValue = watch('title');
  const slugValue = watch('slug');
  const contentValue = watch('content');
  const statusValue = watch('status');
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
        const tagsData = Array.isArray(post?.tags) ? post.tags : [];
        const categoriesData = Array.isArray(post?.categories) ? post.categories : [];

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
      } catch (error) {
        toast.error('No se pudo cargar el post solicitado.');
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

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-slate-400">
        <span className="animate-pulse text-sm">Cargando formulario...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="grid gap-6 lg:grid-cols-2">
          <InputField
            control={control}
            name="title"
            label="Título"
            placeholder="Ingresa el título del post"
            autoComplete="off"
          />
          <InputField
            control={control}
            name="slug"
            label="Slug"
            placeholder="auto-generado"
            helperText="Este valor se utilizará en la URL pública."
            autoComplete="off"
          />
        </div>
        <TextareaField
          control={control}
          name="excerpt"
          label="Resumen"
          rows={4}
          placeholder="Introduce un resumen breve del post"
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="post-content">
            Contenido
          </label>
          <ReactQuill
            id="post-content"
            theme="snow"
            value={contentValue}
            onChange={(value) => setValue('content', value, { shouldDirty: true })}
            modules={quillModules}
            aria-label="Contenido del post"
          />
          {displayedContentError ? (
            <p className="text-xs text-red-500">{displayedContentError}</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Utiliza el editor para dar formato al contenido del post.
            </p>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SelectField
            control={control}
            name="category"
            label="Categoría"
            placeholder="Selecciona una categoría"
            helperText="Puedes crear nuevas categorías desde la sección correspondiente."
          >
            <option value="">Sin categoría</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <MultiSelectField
            control={control}
            name="tags"
            label="Tags"
            options={tagOptions}
            placeholder="Selecciona tags relacionados"
            helperText="Puedes elegir varias etiquetas o crear nuevas para organizar el contenido."
            isCreatable
            onCreateOption={handleCreateTag}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <InputField
            control={control}
            name="image"
            label="Imagen destacada (URL)"
            placeholder="https://..."
            helperText="Utiliza una URL pública accesible desde el backend."
          />
          <InputField
            control={control}
            name="thumb"
            label="Miniatura (URL)"
            placeholder="https://..."
            helperText="Será usada para listados y tarjetas."
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <InputField
            control={control}
            name="imageAlt"
            label="Texto alternativo de la imagen"
            placeholder="Describe brevemente la imagen"
          />
          <InputField
            control={control}
            name="author"
            label="Autor o autora"
            placeholder="Nombre visible en el post"
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SelectField
            control={control}
            name="status"
            label="Estado"
            helperText="Selecciona si el post se publica ahora o queda programado."
          >
            <option value="published">Publicado</option>
            <option value="scheduled">Programado</option>
          </SelectField>
          <InputField
            control={control}
            name="published_at"
            type="date"
            label={statusValue === 'scheduled' ? 'Fecha programada' : 'Fecha de publicación'}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Guardando...'
            : mode === 'edit'
              ? 'Guardar cambios'
              : 'Crear post'}
        </Button>
      </div>
    </form>
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
