import { Toaster } from 'sonner';
import { useUIStore } from '../../store/useUI';

function SonnerProvider({ children }) {
  const theme = useUIStore((state) => state.theme);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        theme={theme === 'dark' ? 'dark' : 'light'}
        closeButton
        duration={3500}
        toastOptions={{
          className:
            'rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100'
        }}
      />
    </>
  );
}

export default SonnerProvider;
