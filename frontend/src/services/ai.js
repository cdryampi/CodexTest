const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
const LARGE_RESPONSE_HINT =
  'El servicio de traducción no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.';

export function isAIConfigured() {
  const key = import.meta.env?.VITE_OPEN_IA_KEY;
  return Boolean(key && typeof key === 'string' && key.trim().length > 0);
}

const normalizeLang = (value) => (value ? value.toString().trim().toLowerCase() : '');

const buildUserPrompt = ({ text, targetLang, sourceLang, format, tone }) => {
  const detectedSource = sourceLang ? normalizeLang(sourceLang) : 'origen detectado automáticamente';
  const normalizedTarget = normalizeLang(targetLang);
  const normalizedFormat = format === 'html' ? 'HTML' : 'Markdown';
  const normalizedTone = tone || 'neutral';

  return [
    `Idioma origen: ${detectedSource}.`,
    `Idioma destino: ${normalizedTarget}.`,
    `Formato a conservar: ${normalizedFormat}.`,
    `Tono deseado: ${normalizedTone}.`,
    'Traduce el siguiente contenido sin añadir comentarios ni notas adicionales.',
    'Texto:',
    text
  ].join('\n');
};

export async function translateText({
  text,
  targetLang,
  sourceLang = null,
  format = 'markdown',
  tone = 'neutral'
}) {
  if (!isAIConfigured()) {
    throw new Error('Configura la variable VITE_OPEN_IA_KEY antes de solicitar traducciones.');
  }

  const normalizedText = (text ?? '').toString();
  if (!normalizedText.trim()) {
    throw new Error('No hay texto disponible para traducir.');
  }

  const normalizedTarget = normalizeLang(targetLang);
  if (!normalizedTarget) {
    throw new Error('Debes indicar un idioma de destino válido.');
  }

  const apiKey = import.meta.env.VITE_OPEN_IA_KEY;
  const systemPrompt =
    'Eres un asistente de traducción para un blog técnico. Conserva formato (Markdown/HTML), respetando código/links. No inventes contenido. Mantén el tono.';

  const payload = {
    model: DEFAULT_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: buildUserPrompt({
          text: normalizedText,
          targetLang: normalizedTarget,
          sourceLang,
          format,
          tone
        })
      }
    ]
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
    throw new Error('No fue posible contactar el servicio de traducción. Verifica tu conexión.');
  }

  if (!response.ok) {
    let detail = LARGE_RESPONSE_HINT;
    try {
      const errorPayload = await response.json();
      if (errorPayload?.error?.message) {
        detail = errorPayload.error.message;
      }
    } catch (parseError) {
      // Silenciar parseos fallidos.
    }

    if (response.status === 401) {
      throw new Error('La clave de OpenAI no es válida o ha expirado.');
    }
    if (response.status === 429) {
      throw new Error('Se alcanzó el límite de uso de la API de OpenAI. Inténtalo más tarde.');
    }

    throw new Error(detail);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('No fue posible interpretar la respuesta del servicio de traducción.');
  }

  const translated = data?.choices?.[0]?.message?.content;
  if (!translated) {
    throw new Error('El servicio de traducción no devolvió un resultado.');
  }

  return translated.trim();
}
