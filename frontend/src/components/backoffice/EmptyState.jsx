import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FileQuestion } from 'lucide-react';

function EmptyState({ title, description, action, icon: Icon }) {
  const EffectiveIcon = Icon || FileQuestion;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300/60 bg-white/70 px-8 py-16 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10 text-sky-500 dark:bg-sky-400/10 dark:text-sky-300">
        <EffectiveIcon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
    </motion.div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  action: PropTypes.node,
  icon: PropTypes.elementType
};

EmptyState.defaultProps = {
  description: null,
  action: null,
  icon: null
};

export default EmptyState;
