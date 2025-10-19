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
import FileUpload from '../../components/forms/FileUpload.jsx';
import Switch from '../../components/forms/Switch.jsx';
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
  value: z.union([z.string(), z.number()]),
  label: z.string()
});

const postSchema = z
  .object({
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.'),
    slug: z.string().trim().min(3, 'El slug debe tener al menos 3 caracteres.'),
    excerpt: z.string().optional(),
    content: z.string(),
    category: z.string().min(1, 'Selecciona una categoría.'),
    tags: z.array(tagOptionSchema).optional(),
    image: z.any().nullable().optional(),
    published: z.boolean().default(false)
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
  const { id } = useParams();
  const isEditMode = Boolean(id);

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
      image: null,
      published: false
    }
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [existingImage, setExistingImage] = useState(null);
  const [contentError, setContentError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const titleValue = watch('title');
  const slugValue = watch('slug');
  const contentValue = watch('content');
  const imageValue = watch('image');
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

  useEffect(() => {
    if (imageValue instanceof File) {
      const objectUrl = URL.createObjectURL(imageValue);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    if (!imageValue) {
      setPreviewUrl(existingImage ?? null);
    }
    return undefined;
  }, [imageValue, existingImage]);

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

      setTagOptions(
        normalizeCollection(tagsResponse).map((tag) => ({
          value: tag.id ?? tag.slug,
          label: tag.name ?? tag.title ?? 'Sin nombre'
        }))
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
      const post = await obtenerPost(id);
      const tagsData = post.tags_detail ?? post.tags ?? [];
      const categoryValue =
        post.category ??
        post.category_slug ??
        post.category_detail?.slug ??
        post.category_detail?.id ??
        '';

      reset({
        title: post.title ?? '',
        slug: post.slug ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        category: categoryValue,
        tags: tagsData.map((tag) => ({
          value: tag.id ?? tag.slug,
          label: tag.name ?? tag.title ?? tag
        })),
        image: null,
        published: Boolean(post.published)
      });

      if (post.image || post.featured_image) {
        setExistingImage(post.image ?? post.featured_image);
        setPreviewUrl(post.image ?? post.featured_image);
      }
    } catch (error) {
      toast.error('No se pudo cargar el post solicitado.');
      navigate('/dashboard/posts');
    }
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
  }, [id]);

  useEffect(() => {
    const plain = contentValue?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (plain && plain.length >= 20) {
      setContentError(null);
    }
  }, [contentValue]);

  const displayedContentError = validationContentError ?? contentError;

  const onSubmit = async (values) => {
    const formData = new FormData();
    formData.append('title', values.title.trim());
    formData.append('slug', values.slug.trim());
    formData.append('excerpt', values.excerpt ?? '');
    formData.append('content', values.content);
    formData.append('category', values.category);
    (values.tags ?? []).forEach((tag) => {
      formData.append('tags[]', tag.value);
    });
    formData.append('published', values.published ? 'true' : 'false');

    if (values.image instanceof File) {
      formData.append('image', values.image);
    }

    try {
      if (isEditMode) {
        await actualizarPost(id, formData);
        toast.success('Post actualizado correctamente.');
      } else {
        await crearPost(formData);
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
                helperText="Puedes elegir varias etiquetas para mejorar el filtrado."
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <FileUpload
                control={control}
                name="image"
                label="Imagen destacada"
                helperText="Formatos aceptados: JPG, PNG o WebP. Máximo 5MB."
                accept="image/*"
                onClear={() => {
                  setExistingImage(null);
                  setPreviewUrl(null);
                }}
              />
              <div className="flex flex-col gap-3">
                <Switch
                  control={control}
                  name="published"
                  label="Publicar inmediatamente"
                  helperText="Si está activado, el post será visible para la audiencia."
                />
                {previewUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                    <img src={previewUrl} alt="Vista previa de la imagen" className="h-40 w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500">
                    La vista previa de la imagen aparecerá aquí.
                  </div>
                )}
              </div>
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

