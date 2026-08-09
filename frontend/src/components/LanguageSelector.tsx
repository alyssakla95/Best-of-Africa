import { GlobeIcon, CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const current = SUPPORTED_LANGUAGES.find(item => item.code === language) ?? SUPPORTED_LANGUAGES[0];
  const interfaceCoverage: Record<string, string> = {
    en: 'Full interface',
    pt: 'Interface completa',
    fr: 'Navigation révisée',
    de: 'Geprüfte Navigation',
    ar: 'تنقّل مراجع',
    hi: 'समीक्षित नेविगेशन',
    zh: '已审核导航',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${language === 'pt' ? 'Idioma' : t('language.label', 'Language')}: ${current.name}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <GlobeIcon className="h-3.5 w-3.5" />
        <span className="font-bold text-[10px] uppercase tracking-widest">{current.code}</span>
        <ChevronDownIcon className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {SUPPORTED_LANGUAGES.map(item => (
          <DropdownMenuItem
            key={item.code}
            lang={item.code}
            dir={item.dir}
            onSelect={() => setLanguage(item.code)}
            className="flex cursor-pointer items-center justify-between gap-4"
          >
            <span className="min-w-0" data-no-translate><span className="block">{item.name}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{interfaceCoverage[item.code]}</span></span>
            {item.code === language && <CheckIcon className="h-4 w-4 shrink-0 text-accent-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
