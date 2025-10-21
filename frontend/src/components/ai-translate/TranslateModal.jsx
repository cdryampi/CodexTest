import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Checkbox } from 'flowbite-react';
import { toast } from 'sonner';
import { Languages, Save, UploadCloud, X } from 'lucide-react';
import { translateText } from '../../services/ai.js';
import { generateLocalizedSlug } from '../../services/api.js';
import LanguageFlags from './LanguageFlags.jsx';
import TranslateButton from './TranslateButton.jsx';
import ConfirmModal from '../backoffice/ConfirmModal.jsx';
import LoadingBar from '../ui/LoadingBar.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { cn } from '../../lib/utils.js';
import { getFieldOrder, hashText, pickTranslatableFields } from '../../lib/text.js';

const LARGE_TEXT_THRESHOLD = 1800;
const DEFAULT_STATUSES = { es: 'origen', en: 'pendiente', ca: 'pendiente' };
const FIELD_LABELS = {
  title: 'Título',
  excerpt: 'Resumen',
  content: 'Contenido',
  slug: 'Slug',
  name: 'Nombre',
  description: 'Descripción'
};

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés', flag: '🇬🇧' },
  { code: 'ca', label: 'Catalán', flag: '🇨🇦' }
];

const detectHtml = (value) => /<[^>]+>/.test(value ?? '');

const isBrowser = typeof window !== 'undefined';

const readCache = (key) => {
  if (!isBrowser) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const writeCache = (key, value) => {
  if (!isBrowser) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignorar almacenamiento fallido.
  }
};

function TranslateModal({
  open,
  onOpenChange,
  entityType,
  idOrSlug,
  fields,
  currentLang,
  allowSave,
  onApply,
  onSave,
  preferredTargetLang
}) {
  const baseFields = useMemo(() => pickTranslatableFields(entityType, fields), [entityType, fields]);
  const fieldOrder = useMemo(() => {
    const allowed = getFieldOrder(entityType);
    return allowed.filter((key) => baseFields[key] !== undefined);
  }, [entityType, baseFields]);

  const [targetLang, setTargetLang] = useState(preferredTargetLang ?? 'en');
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [translations, setTranslations] = useState({});
  const [activeField, setActiveField] = useState(fieldOrder[0] ?? null);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [includeFullContent, setIncludeFullContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [needsLargeConfirm, setNeedsLargeConfirm] = useState(false);
  const [pendingLength, setPendingLength] = useState(0);
  const [confirmInsert, setConfirmInsert] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveField((previous) => (previous && fieldOrder.includes(previous) ? previous : fieldOrder[0] ?? null));
      setStatuses((prev) => ({ ...DEFAULT_STATUSES, ...prev }));
      setIncludeFullContent(false);
    } else {
      setStatuses(DEFAULT_STATUSES);
      setTranslations({});
      setTargetLang(preferredTargetLang ?? 'en');
      setPreserveFormatting(true);
      setIncludeFullContent(false);
      setNeedsLargeConfirm(false);
      setPendingLength(0);
      setErrorMessage('');
      setConfirmInsert(false);
    }
  }, [open, fieldOrder]);

  const currentTranslation = translations[targetLang] ?? {};

  useEffect(() => {
    if (open && preferredTargetLang && preferredTargetLang !== targetLang) {
      setTargetLang(preferredTargetLang);
    }
  }, [open, preferredTargetLang, targetLang]);

  const buildEntries = useCallback(() => {
    const entries = Object.entries(baseFields).filter(([, value]) => typeof value === 'string' && value.trim().length > 0);
    const filtered = entries.filter(([key]) => key !== 'slug');
    if (entityType === 'post' && !includeFullContent) {
      return filtered.filter(([key]) => key === 'title' || key === 'excerpt');
    }
    return filtered;
  }, [baseFields, entityType, includeFullContent]);

  const cacheKey = useMemo(() => {
    const payload = {
      entityType,
      id: idOrSlug,
      targetLang,
      preserveFormatting,
      includeFullContent,
      base: buildEntries().map(([key, value]) => [key, value])
    };
    return `ai-translate:${entityType}:${targetLang}:${hashText(JSON.stringify(payload))}`;
  }, [entityType, idOrSlug, targetLang, preserveFormatting, includeFullContent, buildEntries]);

  const hasMarkup = useMemo(() => {
    const entries = buildEntries();
    return entries.some(([, value]) => detectHtml(value));
  }, [buildEntries]);

  const handleTranslate = useCallback(
    async (force = false) => {
      setErrorMessage('');
      const entries = buildEntries();
      const totalLength = entries.reduce((acc, [, value]) => acc + value.length, 0);
      if (!force && totalLength > LARGE_TEXT_THRESHOLD) {
        setNeedsLargeConfirm(true);
        setPendingLength(totalLength);
        toast.info('Confirma que deseas traducir un contenido extenso.');
        return;
      }

      const cached = readCache(cacheKey);
      if (cached?.result) {
        setTranslations((prev) => ({ ...prev, [targetLang]: cached.result }));
        setStatuses((prev) => ({ ...prev, [targetLang]: 'listo (cache)', es: prev.es ?? DEFAULT_STATUSES.es }));
        setNeedsLargeConfirm(false);
        toast.success('Traducción lista (recuperada de caché).');
        return;
      }

      if (entries.length === 0) {
        toast.info('No hay texto disponible para traducir.');
        return;
      }

      const format = preserveFormatting ? 'markdown' : 'plain';

      setLoading(true);
      setNeedsLargeConfirm(false);
      try {
        const results = {};
        for (const [key, value] of entries) {
          // eslint-disable-next-line no-await-in-loop
          const translated = await translateText({
            text: value,
            targetLang,
            sourceLang: currentLang,
            format
          });
          results[key] = translated;
        }

        if (baseFields.slug !== undefined) {
          const sourceForSlug = results.title ?? results.name ?? baseFields.title ?? baseFields.name ?? '';
          results.slug = generateLocalizedSlug(sourceForSlug || baseFields.slug || '');
        }

        setTranslations((prev) => ({ ...prev, [targetLang]: results }));
        setStatuses((prev) => ({ ...prev, [targetLang]: 'listo', es: prev.es ?? DEFAULT_STATUSES.es }));
        writeCache(cacheKey, { result: results, savedAt: Date.now() });
        toast.success('Traducción lista.');
      } catch (error) {
        setErrorMessage(error?.message ?? 'No se pudo obtener la traducción.');
        toast.error(error?.message ?? 'No se pudo obtener la traducción.');
      } finally {
        setLoading(false);
      }
    },
    [baseFields, buildEntries, cacheKey, currentLang, preserveFormatting, targetLang]
  );

  const handleConfirmLargeContent = useCallback(() => {
    handleTranslate(true);
  }, [handleTranslate]);

  const handleChangeField = useCallback(
    (field, value) => {
      setTranslations((prev) => ({
        ...prev,
        [targetLang]: {
          ...(prev[targetLang] ?? {}),
          [field]: value
        }
      }));
      setStatuses((prev) => ({ ...prev, [targetLang]: 'editado', es: prev.es ?? DEFAULT_STATUSES.es }));
    },
    [targetLang]
  );

  const handleApply = useCallback(() => {
    if (!currentTranslation || Object.keys(currentTranslation).length === 0) {
      toast.info('Genera una traducción antes de insertarla.');
      return;
    }
    if (!onApply) {
      toast.info('No hay formulario asociado para insertar la traducción.');
      return;
    }
    setConfirmInsert(true);
  }, [currentTranslation, onApply]);

  const confirmApply = useCallback(() => {
    if (!onApply) {
      setConfirmInsert(false);
      return;
    }
    onApply(targetLang, currentTranslation);
    setConfirmInsert(false);
    toast.success('Traducción insertada en el formulario.');
  }, [onApply, targetLang, currentTranslation]);

  const handleSave = useCallback(async () => {
    if (!onSave) {
      toast.info('Esta vista no permite guardar la traducción automáticamente.');
      return;
    }
    if (!currentTranslation || Object.keys(currentTranslation).length === 0) {
      toast.info('Genera y revisa la traducción antes de guardarla.');
      return;
    }
    setSaving(true);
    try {
      await onSave(targetLang, currentTranslation);
      setStatuses((prev) => ({ ...prev, [targetLang]: 'guardado', es: prev.es ?? DEFAULT_STATUSES.es }));
      toast.success('Traducción guardada correctamente.');
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar la traducción.');
    } finally {
      setSaving(false);
    }
  }, [currentTranslation, onSave, targetLang]);

  const closeModal = useCallback(
    (nextOpen) => {
      if (onOpenChange) {
        onOpenChange(nextOpen);
      }
    },
    [onOpenChange]
  );

  const toggleIncludeContent = useCallback((event) => {
    const { checked } = event.target;
    setIncludeFullContent(Boolean(checked));
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={closeModal}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-5xl items-center justify-center px-4 py-10"
              >
                <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/90">
                  <LoadingBar active={loading || saving} />
                  <div className="flex items-start justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                        <Languages className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                          Asistente de traducción
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-slate-500 dark:text-slate-400">
                          El texto se envía a OpenAI para generar una propuesta. Revisa cada sugerencia antes de guardarla.
                        </Dialog.Description>
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:hover:bg-slate-800"
                        aria-label="Cerrar asistente de traducción"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <LanguageFlags
                        selected={targetLang}
                        onSelect={(lang) => {
                          if (lang === 'es') return;
                          setTargetLang(lang);
                        }}
                        statuses={statuses}
                        options={LANGUAGE_OPTIONS}
                        disabledCodes={['es']}
                      />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={preserveFormatting}
                            onChange={(event) => setPreserveFormatting(Boolean(event.target.checked))}
                            className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                            aria-label="Mantener formato Markdown"
                          />
                          <span>Mantener formato Markdown</span>
                        </label>
                        {entityType === 'post' ? (
                          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                            <Checkbox
                              checked={includeFullContent}
                              onChange={toggleIncludeContent}
                              className="focus:ring-sky-500"
                              aria-describedby="translate-content-helper"
                            />
                            <span>Incluir contenido completo</span>
                          </label>
                        ) : null}
                      </div>
                    </div>
                    {entityType === 'post' ? (
                      <p id="translate-content-helper" className="text-xs text-slate-500 dark:text-slate-400">
                        Por defecto se traduce únicamente título y resumen para optimizar el uso de tokens.
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {preserveFormatting ? (
                        <p>El modelo intentará respetar el formato Markdown, incluyendo listas, enlaces y etiquetas HTML.</p>
                      ) : (
                        <p>La traducción devolverá texto plano sin formato.</p>
                      )}
                      {!preserveFormatting && hasMarkup ? (
                        <p className="text-amber-600 dark:text-amber-400">
                          Se detectó HTML en el contenido original; al convertirlo a texto plano podrías perder etiquetas o estilos.
                        </p>
                      ) : null}
                    </div>

                    {fieldOrder.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fieldOrder.map((field) => (
                          <button
                            key={field}
                            type="button"
                            onClick={() => setActiveField(field)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
                              activeField === field
                                ? 'border-sky-400/70 bg-sky-500/10 text-sky-700 dark:border-sky-400/60 dark:bg-sky-400/10 dark:text-sky-200'
                                : 'border-slate-200/80 bg-white/80 text-slate-500 hover:border-sky-300 hover:text-sky-600 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-sky-500/60 dark:hover:text-sky-300'
                            )}
                          >
                            {FIELD_LABELS[field] ?? field}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No se encontraron campos traducibles para esta entidad.
                      </p>
                    )}

                    {activeField ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Origen</span>
                          <Textarea
                            value={baseFields[activeField] ?? ''}
                            readOnly
                            className="min-h-[180px] bg-slate-50/80 text-slate-500 dark:bg-slate-950/30 dark:text-slate-400"
                            aria-label={`Contenido original de ${FIELD_LABELS[activeField] ?? activeField}`}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Traducción</span>
                          {activeField === 'slug' ? (
                            <Input
                              value={currentTranslation.slug ?? ''}
                              onChange={(event) => handleChangeField('slug', event.target.value)}
                              placeholder="Slug traducido"
                              aria-label="Slug traducido"
                            />
                          ) : (
                            <Textarea
                              value={currentTranslation[activeField] ?? ''}
                              onChange={(event) => handleChangeField(activeField, event.target.value)}
                              placeholder="Traducción sugerida"
                              aria-label={`Traducción para ${FIELD_LABELS[activeField] ?? activeField}`}
                            />
                          )}
                        </div>
                      </div>
                    ) : null}

                    {needsLargeConfirm ? (
                      <div className="rounded-2xl border border-amber-400/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 dark:border-amber-300/50 dark:bg-amber-500/10 dark:text-amber-200">
                        <p className="font-semibold">Contenido extenso detectado</p>
                        <p className="mt-1">
                          Vas a enviar aproximadamente {pendingLength} caracteres al asistente. Confirma para continuar.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" size="sm" onClick={handleConfirmLargeContent}>
                            Continuar con la traducción
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setNeedsLargeConfirm(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {errorMessage ? (
                      <div className="rounded-2xl border border-red-400/60 bg-red-50/70 px-4 py-3 text-sm text-red-600 dark:border-red-400/50 dark:bg-red-500/10 dark:text-red-200">
                        {errorMessage}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200/70 bg-slate-50/60 px-6 py-4 dark:border-slate-800/70 dark:bg-slate-950/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Entidad: <strong className="uppercase tracking-wide">{entityType}</strong>
                        {idOrSlug ? ` · ID: ${idOrSlug}` : ''}
                      </span>
                      <span>
                        Fuente: <strong className="uppercase tracking-wide">{currentLang}</strong> · Destino:{' '}
                        <strong className="uppercase tracking-wide">{targetLang}</strong>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <TranslateButton
                        onClick={() => handleTranslate(false)}
                        disabled={loading}
                        tooltip={loading ? 'Esperando respuesta del asistente…' : undefined}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleApply}
                        disabled={!onApply || loading}
                      >
                        <UploadCloud className="h-4 w-4" aria-hidden="true" />
                        Insertar en formulario
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={!allowSave || !onSave || loading || saving}
                        aria-busy={saving}
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Guardar en backend
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
      <ConfirmModal
        open={confirmInsert}
        title="¿Insertar traducción?"
        description="Los campos actuales del formulario se reemplazarán por la traducción seleccionada."
        onCancel={() => setConfirmInsert(false)}
        onConfirm={confirmApply}
      />
    </Dialog.Root>
  );
}

TranslateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func,
  entityType: PropTypes.oneOf(['post', 'category', 'tag']).isRequired,
  idOrSlug: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fields: PropTypes.object,
  currentLang: PropTypes.string,
  allowSave: PropTypes.bool,
  onApply: PropTypes.func,
  onSave: PropTypes.func,
  preferredTargetLang: PropTypes.oneOf(['en', 'ca'])
};

TranslateModal.defaultProps = {
  onOpenChange: undefined,
  idOrSlug: null,
  fields: {},
  currentLang: 'es',
  allowSave: false,
  onApply: undefined,
  onSave: undefined,
  preferredTargetLang: 'en'
};

export default TranslateModal;
