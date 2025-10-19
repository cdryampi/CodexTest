import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Spinner } from 'flowbite-react';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import slugify from 'slugify';
import DashboardLayout from './DashboardLayout.jsx';
import Input from '../../components/forms/Input.jsx';
import { crearTag, obtenerTag, actualizarTag } from '../../services/tags.js';
import toast from 'react-hot-toast';

const tagSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  slug: z.string().trim().min(2, 'El slug debe tener al menos 2 caracteres.')
});

function TagForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const autoSlugRef = useRef('');

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { isSubmitting }
  } = useForm({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      slug: ''
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const nameValue = watch('name');
  const slugValue = watch('slug');

  useEffect(() => {
    const newSlug = slugify(nameValue ?? '', { lower: true, strict: true });
    const shouldUpdateSlug = !slugValue || slugValue === autoSlugRef.current;
    autoSlugRef.current = newSlug;
    if (shouldUpdateSlug) {
      setValue('slug', newSlug, { shouldDirty: false, shouldValidate: false });
    }
  }, [nameValue, slugValue, setValue]);

  useEffect(() => {
    const loadTag = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }

      try {
        const tag = await obtenerTag(id);
        reset({
          name: tag.name ?? '',
          slug: tag.slug ?? ''
        });
      } catch (error) {
        toast.error('No se pudo cargar el tag solicitado.');
        navigate('/dashboard/tags');
      } finally {
        setIsLoading(false);
      }
    };

    loadTag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await actualizarTag(id, values);
        toast.success('Tag actualizado correctamente.');
      } else {
        await crearTag(values);
        toast.success('Tag creado correctamente.');
      }
      navigate('/dashboard/tags');
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        let handled = false;
        Object.entries(data).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            handled = true;
            setError(field, { type: 'server', message: messages[0] });
          }
        });
        if (!handled) {
          toast.error('Revisa los campos y vuelve a intentarlo.');
        }
      } else {
        toast.error('No se pudo guardar el tag.');
      }
    }
  };

  return (
    <DashboardLayout
      title={isEditMode ? 'Editar tag' : 'Nuevo tag'}
      description={
        isEditMode
          ? 'Ajusta el nombre y slug del tag seleccionado.'
          : 'Crea un nuevo tag para etiquetar tus publicaciones.'
      }
      actions={
        <Button as={Link} to="/dashboard/tags" color="light" className="flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          Volver al listado
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner aria-label="Cargando tag" size="xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="space-y-6 border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <Input control={control} name="name" label="Nombre" placeholder="Nombre del tag" />
            <Input
              control={control}
              name="slug"
              label="Slug"
              placeholder="slug-del-tag"
              helperText="Se utiliza en la URL para filtrar por tag."
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button color="light" type="button" as={Link} to="/dashboard/tags">
                Cancelar
              </Button>
              <Button
                type="submit"
                color="info"
                className="flex items-center gap-2"
                isProcessing={isSubmitting}
                disabled={isSubmitting}
              >
                <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                {isEditMode ? 'Guardar cambios' : 'Crear tag'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </DashboardLayout>
  );
}

export default TagForm;

