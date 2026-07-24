import { ExternalLink } from 'lucide-react';

type PhotoCreditProps = {
  credit?: string | null;
  sourceUrl?: string | null;
  className?: string;
};

export function PhotoCredit({ credit, sourceUrl, className = '' }: PhotoCreditProps) {
  if (!credit || !sourceUrl) return null;
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center gap-1.5 text-[11px] leading-4 underline decoration-current/30 underline-offset-2 hover:decoration-current ${className}`}
      aria-label={`Photography source: ${credit}`}
    >
      Photo: {credit}
      <ExternalLink size={11} aria-hidden="true" />
    </a>
  );
}
