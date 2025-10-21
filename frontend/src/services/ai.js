import axios from 'axios';
import { toast } from 'sonner';
import api, { getStoredTokens } from './api.js';

const LOG_PREFIX = '[AI Translate]';

const MAX_TEXT_LENGTH = 2000;

export function isAIConfigured() {
  const tokens = getStoredTokens();
  return Boolean(tokens?.access);
}

const normalizeLang = (value) => (value ? value.toString().trim().toLowerCase() : '');

const normalizeFormat = (value) => {
  const normalized = (value ?? '').toString().trim().toLowerCase();
  return normalized === 'html' ? 'html' : 'markdown';
};

const extractDetailMessage = (status, data) => {
  if (status === 401) {
    return 'Debes iniciar sesión para solicitar traducciones.';
  }

  if (status === 429) {
    return 'Se alcanzó el límite de uso del servicio de traducción. Inténtalo más tarde.';
  }

  if (status === 503) {
    return (
      (data && typeof data.detail === 'string' && data.detail) ||
      'El servicio de traducción no está disponible en este momento.'
    );
  }

  if (status === 502) {
    return (
      (data && typeof data.detail === 'string' && data.detail) ||
      'El servicio de traducción devolvió una respuesta no válida.'
    );
  }

  if (data && typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail.trim();
  }

  return 'El servicio de traducción no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.';
};

export async function translateText({
  text,
  targetLang,
  sourceLang = 'es',
  format = 'markdown'
}) {
  if (!isAIConfigured()) {
    const message = 'Debes iniciar sesión para solicitar traducciones.';
    console.warn(`${LOG_PREFIX} Solicitud bloqueada por falta de sesión o token.`);
    toast.error(message);
    throw new Error(message);
  }

  const normalizedText = (text ?? '').toString();
  if (!normalizedText.trim()) {
    const message = 'No hay texto disponible para traducir.';
    toast.error(message);
    throw new Error(message);
  }

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    const message = `El texto supera el límite permitido (${MAX_TEXT_LENGTH} caracteres). Reduce el contenido e inténtalo de nuevo.`;
    console.warn(`${LOG_PREFIX} Texto rechazado por exceder el límite permitido (${normalizedText.length} caracteres).`);
    toast.warning(message);
    throw new Error(message);
  }

  const normalizedTarget = normalizeLang(targetLang);
  if (!normalizedTarget) {
    const message = 'Debes indicar un idioma de destino válido.';
    console.warn(`${LOG_PREFIX} Traducción sin idioma de destino válido.`);
    toast.error(message);
    throw new Error(message);
  }

  const normalizedSource = normalizeLang(sourceLang);
  const normalizedFormat = normalizeFormat(format);

  const payload = {
    text: normalizedText,
    target_lang: normalizedTarget,
    format: normalizedFormat
  };

  if (normalizedSource) {
    payload.source_lang = normalizedSource;
  }

  try {
    const response = await api.post('ai/translations/', payload);
    const data = response.data ?? {};
    const translated = typeof data.translation === 'string' ? data.translation.trim() : '';

    if (!translated) {
      const message = 'El servicio de traducción no devolvió un resultado.';
      console.warn(`${LOG_PREFIX} Respuesta sin traducción válida del backend.`, data);
      toast.error(message);
      throw new Error(message);
    }

    return translated;
  } catch (error) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    const response = axiosError?.response ?? error?.response ?? null;
    const status = response?.status ?? axiosError?.status ?? error?.status ?? null;
    const data = response?.data ?? axiosError?.response?.data ?? error?.data ?? null;

    const message = response
      ? extractDetailMessage(status, data)
      : 'No fue posible contactar el servicio de traducción. Verifica tu conexión.';

    toast.error(message);
    console.error(
      `${LOG_PREFIX} Error al solicitar traducción al backend.`,
      {
        status: status ?? null,
        data: data ?? null,
        error
      }
    );

    const normalizedError = new Error(message);
    normalizedError.status = status ?? null;
    normalizedError.data = data ?? null;
    throw normalizedError;
  }
}
