import PropTypes from 'prop-types';
import { Tooltip } from 'flowbite-react';
import { Languages } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { isAIConfigured } from '../../services/ai.js';
import { cn } from '../../lib/utils.js';

function TranslateButton({
  children,
  onClick,
  className,
  disabled,
  size,
  tooltip,
  variant
}) {
  const aiReady = isAIConfigured();
  const baseDisabled = disabled || !aiReady;
  const tooltipContent = !aiReady
    ? 'Configura VITE_OPEN_IA_KEY para habilitar el asistente de traducción.'
    : tooltip;

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn('gap-2', className)}
      disabled={baseDisabled}
    >
      <Languages className={cn(children ? 'h-4 w-4' : 'h-4 w-4')} aria-hidden="true" />
      {children ? <span className="font-semibold">{children}</span> : <span>Traducir</span>}
    </Button>
  );

  if (!tooltipContent) {
    return button;
  }

  return (
    <Tooltip content={tooltipContent} trigger="hover" placement="bottom">
      <span className={cn('inline-flex', baseDisabled ? 'cursor-not-allowed' : '')}>
        {button}
      </span>
    </Tooltip>
  );
}

TranslateButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  tooltip: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'])
};

TranslateButton.defaultProps = {
  children: null,
  onClick: undefined,
  className: '',
  disabled: false,
  size: 'sm',
  tooltip: null,
  variant: 'ghost'
};

export default TranslateButton;
