import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type PhotoCreditProps = {
  credit?: string | null;
  sourceUrl?: string | null;
  className?: string;
};

export function PhotoCredit({ credit, sourceUrl, className = '' }: PhotoCreditProps) {
  const { language, t } = useLanguage();
  if (!credit || !sourceUrl) return null;
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer noopener"
      data-no-translate
      className={`inline-flex items-center gap-1.5 text-[11px] leading-4 underline decoration-current/30 underline-offset-2 hover:decoration-current ${className}`}
      aria-label={`${language === 'pt' ? 'Fonte da fotografia' : t('photo.source', 'Photography source')}: ${credit}`}
    >
      {language === 'pt' ? 'Fotografia' : t('photo.credit', 'Photo')}: {credit}
      <ExternalLink size={11} aria-hidden="true" />
    </a>
  );
}
