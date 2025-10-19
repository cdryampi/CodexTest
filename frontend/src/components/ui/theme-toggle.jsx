import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button.jsx';
import { useUIStore, selectIsDark } from '../../store/useUI';

function ThemeToggle({ className }) {
  const isDark = useUIStore(selectIsDark);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeLabel = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={themeLabel}
      title={themeLabel}
      aria-pressed={isDark}
      onClick={() => toggleTheme()}
    >
      {mounted ? (
        isDark ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <span className="h-5 w-5" />
      )}
    </Button>
  );
}

export default ThemeToggle;
