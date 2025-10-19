import { useEffect } from 'react';
import { ToggleSwitch } from 'flowbite-react';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button.jsx';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { useDashboardStore } from '../../store/dashboard.js';

function DashboardSettings() {
  const { setHeader } = useDashboardLayout();
  const sidebarCollapsed = useDashboardStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useDashboardStore((state) => state.setSidebarCollapsed);
  const density = useDashboardStore((state) => state.density);
  const setDensity = useDashboardStore((state) => state.setDensity);
  const resetFilters = useDashboardStore((state) => state.resetFilters);

  useEffect(() => {
    setHeader({
      title: 'Ajustes',
      description: 'Personaliza la experiencia del backoffice a tu estilo.',
      showSearch: false,
      actions: null
    });
  }, [setHeader]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <header className="mb-6 flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Settings2 className="h-6 w-6" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preferencias del panel</h2>
            <p className="text-sm">Estos cambios se guardan automáticamente en tu navegador.</p>
          </div>
        </header>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Colapsar barra lateral</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mantén el menú lateral oculto por defecto al ingresar al panel.
                </p>
              </div>
              <ToggleSwitch
                checked={sidebarCollapsed}
                label="Colapsar"
                onChange={(checked) => {
                  setSidebarCollapsed(checked);
                  toast.success(`La barra lateral se ${checked ? 'mostrará colapsada' : 'mostrará expandida'} desde ahora.`);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800/70 dark:bg-slate-900/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Densidad de la tabla</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ajusta el espaciado de filas para priorizar legibilidad o volumen de información.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={density === 'comfortable' ? 'secondary' : 'ghost'}
                  onClick={() => setDensity('comfortable')}
                >
                  Cómoda
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={density === 'compact' ? 'secondary' : 'ghost'}
                  onClick={() => setDensity('compact')}
                >
                  Compacta
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800/70 dark:bg-slate-900/40">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Filtros rápidos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ¿Los filtros se descontrolaron? Restablece la búsqueda y los selectores en un solo paso.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="self-start"
              onClick={() => {
                resetFilters();
                toast.success('Filtros del dashboard restablecidos.');
              }}
            >
              Restablecer filtros guardados
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardSettings;
