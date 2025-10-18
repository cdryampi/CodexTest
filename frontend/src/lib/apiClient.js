const API_BASE_URL = 'https://backendblog.yampi.eu';
// TODO: parametrizar con window.__ENV__?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '/api/'

const DEFAULT_TIMEOUT = 12000;

const buildUrl = (path, params = {}) => {
  const normalizedPath = path.startsWith('http')
    ? path
    : `${API_BASE_URL.replace(/\/?$/, '')}/${path.replace(/^\//, '')}`;
  const url = new URL(normalizedPath);
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
      } else {
        url.searchParams.set(key, value);
      }
    });
  return url;
};

const applyTimeout = (timeout, externalSignal) => {
  if (typeof AbortController === 'undefined') {
    return { signal: externalSignal ?? null, cancel: () => {} };
  }

  const controller = new AbortController();
  let removeExternalListener;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      const abortExternal = () => controller.abort(externalSignal.reason);
      externalSignal.addEventListener('abort', abortExternal, { once: true });
      removeExternalListener = () => {
        externalSignal.removeEventListener('abort', abortExternal);
      };
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('Tiempo de espera agotado', 'TimeoutError'));
  }, timeout);

  const cancel = () => {
    clearTimeout(timeoutId);
    if (removeExternalListener) {
      removeExternalListener();
    }
  };

  return { signal: controller.signal, cancel };
};

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  return null;
};

const normalizeError = (error, response, data) => {
  if (error?.name === 'AbortError') {
    return {
      name: 'AbortError',
      message: 'La petición fue cancelada.',
      status: response?.status ?? null,
      data: data ?? null
    };
  }

  if (response) {
    const detailMessage =
      data?.detail || data?.error || data?.message || 'Ocurrió un error inesperado.';
    return {
      name: 'ApiError',
      message: detailMessage,
      status: response.status,
      data: data ?? null
    };
  }

  return {
    name: 'NetworkError',
    message: 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.',
    status: null,
    data: null
  };
};

async function request(method, path, { params, body, headers, signal, timeout = DEFAULT_TIMEOUT } = {}) {
  const url = buildUrl(path, params);
  const finalHeaders = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  };

  const { signal: timeoutSignal, cancel } = applyTimeout(timeout, signal);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: timeoutSignal,
      credentials: 'omit'
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      const normalized = normalizeError(null, response, data);
      const error = new Error(normalized.message);
      Object.assign(error, normalized);
      throw error;
    }

    return { data, status: response.status };
  } catch (error) {
    if (error.name === 'AbortError' && signal && signal.aborted) {
      throw Object.assign(error, { name: 'AbortError', status: null, data: null });
    }

    if (error.name === 'AbortError') {
      throw Object.assign(error, {
        name: 'AbortError',
        message: 'La solicitud se canceló antes de completarse.',
        status: null,
        data: null
      });
    }

    const normalized = normalizeError(error, error.response, error.data);
    const wrapped = new Error(normalized.message);
    Object.assign(wrapped, normalized);
    throw wrapped;
  } finally {
    cancel();
  }
}

export const apiGet = (path, options) => request('GET', path, options);
export const apiPost = (path, options) => request('POST', path, options);
export { API_BASE_URL };
