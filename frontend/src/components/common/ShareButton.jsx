import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { CheckIcon, ExclamationTriangleIcon, ShareIcon } from '@heroicons/react/24/outline';

const STATUS = {
  IDLE: 'idle',
  SHARED: 'shared',
  COPIED: 'copied',
  ERROR: 'error'
};

const STATUS_TIMEOUT = 4000;

function ShareButton({
  url,
  title = 'Compartir este contenido',
  text = 'Te comparto un artículo interesante del blog',
  label = 'Compartir',
  className = '',
  children
}) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const statusMessageId = useId();

  const shareUrl = useMemo(() => {
    if (url) {
      return url;
    }
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }, [url]);

  useEffect(() => {
    if (status === STATUS.IDLE) {
      return undefined;
    }
    if (typeof window === 'undefined') {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setStatus(STATUS.IDLE);
    }, STATUS_TIMEOUT);

    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) {
      setStatus(STATUS.ERROR);
      return;
    }

    const shareData = { url: shareUrl, title, text };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setStatus(STATUS.SHARED);
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setStatus(STATUS.COPIED);
        return;
      } catch (error) {
        console.error('No se pudo copiar el enlace al portapapeles', error);
      }
    }

    setStatus(STATUS.ERROR);
  }, [shareUrl, text, title]);

  const statusMessage = useMemo(() => {
    switch (status) {
      case STATUS.SHARED:
        return 'Enlace compartido correctamente.';
      case STATUS.COPIED:
        return 'Enlace copiado al portapapeles.';
      case STATUS.ERROR:
        return 'No fue posible compartir automáticamente. Copia el enlace manualmente.';
      default:
        return 'Pulsa para compartir este contenido.';
    }
  }, [status]);

  const renderIcon = () => {
    switch (status) {
      case STATUS.SHARED:
      case STATUS.COPIED:
        return <CheckIcon className="h-5 w-5" aria-hidden="true" />;
      case STATUS.ERROR:
        return <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />;
      default:
        return <ShareIcon className="h-5 w-5" aria-hidden="true" />;
    }
  };

  const showAssistiveMessage = status !== STATUS.IDLE;

  return (
    <div className={`inline-flex flex-col items-start gap-2 ${className}`.trim()}>
      <button
        type="button"
        onClick={handleShare}
        aria-describedby={statusMessageId}
        aria-label={label}
        className="inline-flex items-center gap-2 rounded-full border border-sky-500/60 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-reduce:transform-none motion-reduce:hover:transform-none hover:-translate-y-0.5 hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:ring-0 dark:border-sky-400/60 dark:bg-sky-500 dark:hover:bg-sky-400"
      >
        {renderIcon()}
        <span>{children ?? label}</span>
      </button>
      <div id={statusMessageId} role="status" aria-live="polite" className="text-xs text-slate-500 dark:text-slate-400">
        {showAssistiveMessage ? statusMessage : ' '}
      </div>
      <span className="sr-only" aria-hidden={!showAssistiveMessage}>
        {statusMessage}
      </span>
    </div>
  );
}

export default ShareButton;
