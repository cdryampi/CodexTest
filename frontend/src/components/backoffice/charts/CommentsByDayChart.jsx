import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

function CommentsByDayChart({ data }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70"
    >
      <header className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Comentarios diarios</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumen de interacción reciente de la comunidad.</p>
      </header>
      <div className="h-80 text-slate-500 dark:text-slate-400">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'rgba(59,130,246,0.08)' }}
              contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.85)', color: '#fff' }}
              formatter={(value) => [`${value} comentarios`, 'Comentarios']}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="comments" name="Comentarios" radius={[12, 12, 0, 0]} fill="rgb(59 130 246)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

CommentsByDayChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      comments: PropTypes.number.isRequired
    })
  ).isRequired
};

export default CommentsByDayChart;
