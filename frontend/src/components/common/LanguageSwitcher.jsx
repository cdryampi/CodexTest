import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu.jsx';
import { cn } from '../../lib/utils.js';

const LANGUAGES = [
  { code: 'es', labelKey: 'language.spanish', flag: '🇪🇸' },
  { code: 'en', labelKey: 'language.english', flag: '🇬🇧' }
];

function LanguageSwitcher({ className }) {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language ?? 'es';

  const handleChange = async (code) => {
    if (code === current) {
      return;
    }
    await i18n.changeLanguage(code);
  };

  const activeLanguage = LANGUAGES.find((lang) => lang.code === current) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('inline-flex items-center gap-2 rounded-full px-3 text-sm font-semibold', className)}
          aria-label={t('navbar.language')}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="hidden md:inline-flex items-center gap-1">
            <span aria-hidden="true">{activeLanguage.flag}</span>
            <span>{t(activeLanguage.labelKey)}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-44">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => handleChange(language.code)}
            className="flex items-center gap-2"
            aria-label={t(language.labelKey)}
          >
            <span aria-hidden="true">{language.flag}</span>
            <span className="flex-1">{t(language.labelKey)}</span>
            {current === language.code ? <span className="text-xs text-sky-500">•</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

LanguageSwitcher.propTypes = {
  className: PropTypes.string
};

LanguageSwitcher.defaultProps = {
  className: ''
};

export default LanguageSwitcher;
