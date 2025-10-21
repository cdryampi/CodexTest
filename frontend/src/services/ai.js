import { toast } from 'sonner';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_TEXT_LENGTH = 2000;
const SYSTEM_PROMPT =
  'Eres un asistente de traducción para un blog técnico. Conserva formato Markdown/HTML, respeta enlaces y código, no inventes contenido.';

export function isAIConfigured() {
  const key = import.meta.env?.VITE_OPEN_IA_KEY;
  return Boolean(key && typeof key === 'string' && key.trim().length > 0);
}

const normalizeLang = (value) => (value ? value.toString().trim().toLowerCase() : '');

const buildUserPrompt = ({ text, targetLang, sourceLang, format }) => {
  const detectedSource = sourceLang ? normalizeLang(sourceLang) : 'origen detectado automáticamente';
  const normalizedTarget = normalizeLang(targetLang) || 'es';
  const normalizedFormat = format === 'html' ? 'HTML' : 'Markdown';

  return [
    `Idioma origen: ${detectedSource}.`,
    `Idioma destino: ${normalizedTarget}.`,
    `Formato a conservar: ${normalizedFormat}.`,
    'Traduce el siguiente contenido sin añadir comentarios ni notas adicionales.',
    'Devuelve únicamente el texto traducido sin comillas ni observaciones.',
    'Texto:',
    text
  ].join('\n');
};

const extractTranslation = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload.output)) {
    for (const block of payload.output) {
      const contents = Array.isArray(block?.content) ? block.content : [];
      for (const item of contents) {
        const text = item?.text;
        if (typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      }
    }
  }

  if (Array.isArray(payload.choices)) {
    const message = payload.choices[0]?.message?.content;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  return '';
};

const handleApiError = async (response) => {
  let detail = 'El servicio de traducción no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.';
  try {
    const errorPayload = await response.json();
    if (errorPayload?.error?.message) {
      detail = errorPayload.error.message;
    }
  } catch (error) {
    // Ignorar errores de parsing.
  }

  if (response.status === 401) {
    detail = 'La clave de OpenAI no es válida o ha expirado.';
  } else if (response.status === 429) {
    detail = 'Se alcanzó el límite de uso de la API de OpenAI. Inténtalo más tarde.';
  }

  toast.error(detail);
  throw new Error(detail);
};

export async function translateText({
  text,
  targetLang,
  sourceLang = 'es',
  format = 'markdown'
}) {
  if (!isAIConfigured()) {
    const message = 'Configura VITE_OPEN_IA_KEY antes de solicitar traducciones.';
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
    toast.warning(message);
    throw new Error(message);
  }

  const normalizedTarget = normalizeLang(targetLang);
  if (!normalizedTarget) {
    const message = 'Debes indicar un idioma de destino válido.';
    toast.error(message);
    throw new Error(message);
  }

  const apiKey = import.meta.env.VITE_OPEN_IA_KEY;
  const payload = {
    model: DEFAULT_MODEL,
    temperature: 0.2,
    instructions: SYSTEM_PROMPT,
    input: buildUserPrompt({
      text: normalizedText,
      targetLang: normalizedTarget,
      sourceLang,
      format
    }),
    response_format: { type: 'text' }
  };

  let response;

  try {
    response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    const message = 'No fue posible contactar el servicio de traducción. Verifica tu conexión.';
    toast.error(message);
    throw new Error(message);
  }

  if (!response.ok) {
    await handleApiError(response);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const message = 'No fue posible interpretar la respuesta del servicio de traducción.';
    toast.error(message);
    throw new Error(message);
  }

  const translated = extractTranslation(data);
  if (!translated) {
    const message = 'El servicio de traducción no devolvió un resultado.';
    toast.error(message);
    throw new Error(message);
  }

  return translated.trim();
}
