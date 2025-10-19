import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Spinner } from 'flowbite-react';
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import slugify from 'slugify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DashboardLayout from './DashboardLayout.jsx';
import Input from '../../components/forms/Input.jsx';
import Textarea from '../../components/forms/Textarea.jsx';
import Select from '../../components/forms/Select.jsx';
import MultiSelect from '../../components/forms/MultiSelect.jsx';
import { listarCategorias } from '../../services/categories.js';
import { listarTags } from '../../services/tags.js';
import { actualizarPost, crearPost, obtenerPost } from '../../services/posts.js';
import toast from 'react-hot-toast';

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  if (payload?.data) return payload.data;
  return [];
};

const tagOptionSchema = z.object({
  value: z.string().trim().min(1, 'El tag no puede estar vacío.'),
  label: z.string()
});

const postSchema = z
  .object({
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.'),
    slug: z.string().trim().min(3, 'El slug debe tener al menos 3 caracteres.'),
    excerpt: z.string().optional(),
    content: z.string(),
    category: z.string().min(1, 'Selecciona una categoría.'),
    tags: z.array(tagOptionSchema).default([]),
    image: z.string().url('La URL de la imagen debe ser válida.'),
    thumb: z.string().url('La URL de la miniatura debe ser válida.'),
    imageAlt: z.string().trim().min(3, 'El texto alternativo debe tener al menos 3 caracteres.'),
    author: z.string().trim().min(3, 'Indica el nombre de la persona autora.'),
    date: z
      .string()
      .min(1, 'Selecciona una fecha para el post.')
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Selecciona una fecha válida.')
  })
  .superRefine((value, ctx) => {
    const plain = value.content
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

function PostForm() {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams();
  const isEditMode = Boolean(slugParam);

  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

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
    defaultValues: {
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
      date: initialDate
    }
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentError, setContentError] = useState(null);

  const titleValue = watch('title');
  const slugValue = watch('slug');
  const contentValue = watch('content');
  const tagsValue = watch('tags');
  const autoSlugRef = useRef('');

  const validationContentError = errors?.content?.message;

  useEffect(() => {
    const newSlug = slugify(titleValue ?? '', { lower: true, strict: true });
    const shouldUpdateSlug = !slugValue || slugValue === autoSlugRef.current;
    autoSlugRef.current = newSlug;
    if (shouldUpdateSlug) {
      setValue('slug', newSlug, { shouldDirty: false, shouldValidate: false });
    }
  }, [titleValue, slugValue, setValue]);

  const fetchTaxonomies = async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        listarCategorias(),
        listarTags()
      ]);

      setCategoryOptions(
        normalizeCollection(categoriesResponse).map((category) => ({
          value: category.slug ?? category.id,
          label: category.name ?? category.title ?? 'Sin nombre'
        }))
      );

      const normalizedTags = Array.isArray(tagsResponse) ? tagsResponse : normalizeCollection(tagsResponse);
      setTagOptions(
        normalizedTags.map((tag) => {
          const name = tag.name ?? tag.slug ?? tag;
          return {
            value: name,
            label: tag.postsCount ? `${name} (${tag.postsCount})` : name
          };
        })
      );
    } catch (error) {
      toast.error('No fue posible cargar categorías y tags.');
    }
  };

  const fetchPost = async () => {
    if (!isEditMode) {
      return;
    }

    try {
      const post = await obtenerPost(slugParam);
      const tagsData = Array.isArray(post?.tags) ? post.tags : [];
      const categorySlug = Array.isArray(post?.categories) ? post.categories[0] ?? '' : '';

      const mappedTags = tagsData.map((tag) => ({
        value: tag,
        label: tag
      }));

      reset({
        title: post.title ?? '',
        slug: post.slug ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        category: categorySlug,
        tags: mappedTags,
        image: post.image ?? '',
        thumb: post.thumb ?? '',
        imageAlt: post.imageAlt ?? '',
        author: post.author ?? '',
        date: post.created_at ?? post.date ?? initialDate
      });

      setTagOptions((previous) => {
        const existing = new Map(previous.map((option) => [option.value.toLowerCase(), option]));
        mappedTags.forEach((option) => {
          if (!existing.has(option.value.toLowerCase())) {
            existing.set(option.value.toLowerCase(), option);
          }
        });
        return Array.from(existing.values());
      });
    } catch (error) {
      toast.error('No se pudo cargar el post solicitado.');
      navigate('/dashboard/posts');
    }
  };

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

    setValue('tags', [...(tagsValue ?? []), option], { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTaxonomies();
      await fetchPost();
      setIsLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugParam]);

  useEffect(() => {
    const plain = contentValue?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (plain && plain.length >= 20) {
      setContentError(null);
    }
  }, [contentValue]);

  const displayedContentError = validationContentError ?? contentError;

  const onSubmit = async (values) => {
    const payload = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      excerpt: values.excerpt?.trim() ?? '',
      content: values.content,
      categories: values.category ? [values.category] : [],
      tags: (values.tags ?? []).map((tag) => tag.value),
      image: values.image.trim(),
      thumb: values.thumb.trim(),
      imageAlt: values.imageAlt.trim(),
      author: values.author.trim(),
      date: values.date
    };

    try {
      if (isEditMode) {
        await actualizarPost(slugParam, payload);
        toast.success('Post actualizado correctamente.');
      } else {
        await crearPost(payload);
        toast.success('Post creado correctamente.');
      }
      navigate('/dashboard/posts');
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        let handled = false;
        Object.entries(data).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            handled = true;
            if (field === 'content') {
              setContentError(messages[0]);
            } else {
              setError(field, { type: 'server', message: messages[0] });
            }
          }
        });
        if (!handled) {
          toast.error('Revisa los datos del formulario e inténtalo nuevamente.');
        }
      } else {
        toast.error('No se pudo guardar el post. Intenta de nuevo más tarde.');
      }
    }
  };

  const tagSelectOptions = useMemo(() => tagOptions, [tagOptions]);

  return (
    <DashboardLayout
      title={isEditMode ? 'Editar post' : 'Nuevo post'}
      description={
        isEditMode
          ? 'Actualiza los datos del post y controla su publicación.'
          : 'Completa los campos para crear una nueva publicación.'
      }
      actions={
        <Button as={Link} to="/dashboard/posts" color="light" className="flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          Volver al listado
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner aria-label="Cargando post" size="xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="space-y-6 border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                control={control}
                name="title"
                label="Título"
                placeholder="Ingresa el título del post"
              />
              <Input
                control={control}
                name="slug"
                label="Slug"
                placeholder="auto-generado"
                helperText="Este valor se utilizará en la URL pública."
              />
            </div>
            <Textarea
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
              <Select
                control={control}
                name="category"
                label="Categoría"
                placeholder="Selecciona una categoría"
              >
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <MultiSelect
                control={control}
                name="tags"
                label="Tags"
                options={tagSelectOptions}
                placeholder="Selecciona tags relacionados"
                helperText="Puedes elegir varias etiquetas o crear nuevas para organizar el contenido."
                isCreatable
                onCreateOption={handleCreateTag}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                control={control}
                name="image"
                label="Imagen destacada (URL)"
                placeholder="https://..."
                helperText="Utiliza una URL pública accesible desde el backend."
              />
              <Input
                control={control}
                name="thumb"
                label="Miniatura (URL)"
                placeholder="https://..."
                helperText="Será usada para listados y tarjetas." 
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                control={control}
                name="imageAlt"
                label="Texto alternativo de la imagen"
                placeholder="Describe brevemente la imagen"
              />
              <Input
                control={control}
                name="author"
                label="Autor o autora"
                placeholder="Nombre visible en el post"
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                control={control}
                name="date"
                type="date"
                label="Fecha de publicación"
                helperText="Define la fecha que mostrará la API."
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                color="light"
                type="button"
                as={Link}
                to="/dashboard/posts"
                className="flex items-center gap-2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="info"
                className="flex items-center gap-2"
                isProcessing={isSubmitting}
                disabled={isSubmitting}
              >
                <CloudArrowUpIcon className="h-5 w-5" aria-hidden="true" />
                {isEditMode ? 'Guardar cambios' : 'Crear post'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </DashboardLayout>
  );
}

export default PostForm;

