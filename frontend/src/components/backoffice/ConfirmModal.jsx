import PropTypes from 'prop-types';
import { Modal } from 'flowbite-react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button.jsx';

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
  tone,
  loading
}) {
  return (
    <Modal show={open} size="md" onClose={onCancel} dismissible aria-labelledby="confirm-modal-title">
      <Modal.Header className="border-0 pb-2">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone === 'danger' ? 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300'}`}>
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
        </div>
      </Modal.Header>
      <Modal.Body className="border-0 pt-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta acción no se puede deshacer en el entorno actual. Se enviará al backend cuando la API esté disponible.
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(['default', 'danger']),
  loading: PropTypes.bool
};

ConfirmModal.defaultProps = {
  description: null,
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  tone: 'default',
  loading: false
};

export default ConfirmModal;
