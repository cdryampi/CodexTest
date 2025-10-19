import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, Users, Eye } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('es-ES');

const ICONS = {
  posts: TrendingUp,
  comments: MessageSquare,
  visits: Eye,
  users: Users
};

function StatsCards({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon ? item.icon : ICONS[item.id] ?? TrendingUp;
        return (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25, ease: 'easeOut' }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
                  {numberFormatter.format(item.value ?? 0)}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 transition-transform duration-300 group-hover:scale-105 dark:bg-sky-400/10 dark:text-sky-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            {item.helper ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
            ) : null}
            {item.delta != null ? (
              <p className={`mt-4 text-xs font-semibold uppercase tracking-wide ${item.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.delta >= 0 ? '▲' : '▼'} {Math.abs(item.delta).toFixed(1)}% vs. semana previa
              </p>
            ) : null}
          </motion.article>
        );
      })}
    </div>
  );
}

StatsCards.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.number,
      helper: PropTypes.string,
      delta: PropTypes.number,
      icon: PropTypes.elementType
    })
  ).isRequired
};

export default StatsCards;
