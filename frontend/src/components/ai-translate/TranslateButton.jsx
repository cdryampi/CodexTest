import PropTypes from 'prop-types';
import { Tooltip } from 'flowbite-react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  variant,
  ariaLabel
}) {
  const { t } = useTranslation();
  const aiReady = isAIConfigured();
  const baseDisabled = disabled || !aiReady;
  const fallbackTooltip = aiReady ? tooltip || t('actions.translateAI') : t('ai.configureKey');
  const label = children || t('actions.translateAI');

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn('gap-2', className)}
      disabled={baseDisabled}
      aria-label={ariaLabel || label}
    >
      <Languages className={cn('h-4 w-4')} aria-hidden="true" />
      <span className="font-semibold">{label}</span>
    </Button>
  );

  if (!fallbackTooltip) {
    return button;
  }

  return (
    <Tooltip content={fallbackTooltip} trigger="hover" placement="bottom" style="dark">
      <span className={cn('inline-flex', baseDisabled ? 'cursor-not-allowed opacity-90' : '')}>{button}</span>
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
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
  ariaLabel: PropTypes.string
};

TranslateButton.defaultProps = {
  children: null,
  onClick: undefined,
  className: '',
  disabled: false,
  size: 'sm',
  tooltip: undefined,
  variant: 'ghost',
  ariaLabel: ''
};

export default TranslateButton;
