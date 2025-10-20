import { motion } from 'framer-motion';
import { forwardRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/utils.js';

const MotionButton = motion.button;

const ReactionButton = forwardRef(function ReactionButton(
  { type, label, emoji, count, active = false, disabled = false, onToggle },
  ref
) {
  const handleClick = useCallback(() => {
    if (disabled || typeof onToggle !== 'function') {
      return;
    }
    onToggle(type);
  }, [disabled, onToggle, type]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!onToggle || disabled) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle(type);
      }
    },
    [disabled, onToggle, type]
  );

  return (
    <MotionButton
      ref={ref}
      type="button"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'group relative inline-flex min-w-[3.5rem] items-center justify-center gap-1 rounded-full border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'border-slate-200 bg-white/70 text-slate-600 hover:border-sky-400 hover:text-sky-600 focus-visible:ring-sky-500 focus-visible:ring-offset-white',
        'dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-900',
        active &&
          'border-sky-500 bg-sky-500/10 text-sky-600 shadow-lg shadow-sky-500/20 dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-200',
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {emoji}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {count}
      </span>
      <span className="sr-only">{label}</span>
    </MotionButton>
  );
});

ReactionButton.propTypes = {
  type: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  emoji: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onToggle: PropTypes.func
};

export default ReactionButton;
