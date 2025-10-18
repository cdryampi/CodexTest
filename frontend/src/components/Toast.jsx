import { Toast as FlowbiteToast } from 'flowbite-react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

function Toast({ type = 'success', message, onClose }) {
  if (!message) {
    return null;
  }

  const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;
  const tone = type === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <FlowbiteToast className={`rounded-2xl ${tone}`}>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-sm font-medium">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-xs font-semibold uppercase tracking-wide"
          aria-label="Cerrar notificación"
        >
          Cerrar
        </button>
      </FlowbiteToast>
    </div>
  );
}

export default Toast;
