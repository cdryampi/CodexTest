import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

function PostsByMonthChart({ data }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70"
    >
      <header className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Posts publicados por mes</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Actividad editorial en los últimos 12 meses.</p>
      </header>
      <div className="h-80 text-slate-500 dark:text-slate-400">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(14 165 233)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="rgb(14 165 233)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorDrafts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(129 140 248)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="rgb(129 140 248)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} minTickGap={16} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
            <Tooltip
              cursor={{ stroke: 'rgba(14, 165, 233, 0.2)', strokeWidth: 2 }}
              contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.85)', color: '#fff' }}
              formatter={(value, name) => {
                const label = name === 'published' ? 'Publicados' : name === 'drafts' ? 'Borradores' : name;
                return [`${value} posts`, label];
              }}
              labelFormatter={(label) => label}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: 'inherit' }} />
            <Area type="monotone" dataKey="published" name="Publicados" stroke="rgb(14 165 233)" strokeWidth={2} fill="url(#colorPublished)" />
            <Area type="monotone" dataKey="drafts" name="Borradores" stroke="rgb(129 140 248)" strokeWidth={2} fill="url(#colorDrafts)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

PostsByMonthChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      published: PropTypes.number.isRequired,
      drafts: PropTypes.number.isRequired
    })
  ).isRequired
};

export default PostsByMonthChart;
