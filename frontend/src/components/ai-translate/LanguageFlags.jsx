import PropTypes from 'prop-types';
import { cn } from '../../lib/utils.js';

const DEFAULT_OPTIONS = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés', flag: '🇬🇧' },
  { code: 'ca', label: 'Catalán', flag: '🇨🇦' }
];

function LanguageFlags({
  selected,
  onSelect,
  statuses,
  className,
  options,
  disabledCodes
}) {
  const languages = Array.isArray(options) && options.length > 0 ? options : DEFAULT_OPTIONS;
  const disabled = Array.isArray(disabledCodes) ? disabledCodes : [];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {languages.map((option) => {
        const isActive = selected === option.code;
        const status = statuses?.[option.code] ?? 'pendiente';
        const isDisabled = disabled.includes(option.code);

        const handleClick = () => {
          if (isDisabled) return;
          if (onSelect) {
            onSelect(option.code);
          }
        };

        return (
          <button
            key={option.code}
            type="button"
            onClick={handleClick}
            disabled={isDisabled}
            className={cn(
              'group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
              isActive
                ? 'border-sky-400/70 bg-sky-500/10 text-sky-700 dark:border-sky-400/60 dark:bg-sky-400/10 dark:text-sky-300'
                : 'border-slate-200/80 bg-white/70 text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-sky-500/60 dark:hover:text-sky-300',
              isDisabled ? 'cursor-not-allowed opacity-70 hover:border-slate-200 hover:text-slate-600 dark:hover:border-slate-800 dark:hover:text-slate-300' : ''
            )}
            aria-pressed={isActive}
            aria-label={`Seleccionar idioma ${option.label}`}
            aria-disabled={isDisabled}
          >
            <span className="text-lg" aria-hidden="true">
              {option.flag}
            </span>
            <span className="uppercase tracking-wide">{option.code}</span>
            <span className="text-xs font-medium text-slate-400 transition group-hover:text-current dark:text-slate-500">
              {status}
            </span>
          </button>
        );
      })}
    </div>
  );
}

LanguageFlags.propTypes = {
  selected: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
  statuses: PropTypes.objectOf(PropTypes.string),
  className: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      flag: PropTypes.string.isRequired
    })
  ),
  disabledCodes: PropTypes.arrayOf(PropTypes.string)
};

LanguageFlags.defaultProps = {
  onSelect: undefined,
  statuses: undefined,
  className: '',
  options: undefined,
  disabledCodes: undefined
};

export default LanguageFlags;
