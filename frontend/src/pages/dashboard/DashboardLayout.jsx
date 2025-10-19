import PropTypes from 'prop-types';
import Sidebar from '../../components/Sidebar.jsx';

function DashboardLayout({ title, description, actions, children }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <Sidebar />
      <div className="flex-1">
        <header className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired
};

export default DashboardLayout;

