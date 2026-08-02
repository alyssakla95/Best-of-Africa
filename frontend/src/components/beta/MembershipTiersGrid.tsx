import { CardReveal } from './CardReveal';
import { MEMBERSHIP_TIERS, KO_FI_MEMBERSHIP_URL } from '../../constants/beta';

export const MembershipTiersGrid = () => (
  <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8">
    {MEMBERSHIP_TIERS.map((tier, index) => {
      const cardClass = tier.recommended
        ? 'relative z-10 flex h-full flex-col rounded-3xl border border-navy bg-navy p-8 text-white shadow-[0_20px_50px_rgba(15,31,61,0.18)] md:-translate-y-3 md:p-10'
        : 'relative flex h-full flex-col rounded-3xl border border-navy/15 bg-white p-8 text-navy transition-all duration-300 hover:-translate-y-1 hover:border-navy/40 hover:shadow-[0_20px_40px_rgba(15,31,61,0.08)] md:p-10';

      return (
        <CardReveal key={tier.id} delay={index * 0.12}>
          <article className={cardClass}>
            {tier.recommended && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-navy bg-white px-5 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">
                Best launch value
              </div>
            )}
            <h3 className={`mb-2 mt-2 font-serif text-2xl ${tier.recommended ? 'text-white' : 'text-navy'}`}>{tier.name}</h3>
            <p className={`mb-6 min-h-12 text-sm leading-6 ${tier.recommended ? 'text-white/70' : 'text-navy/65'}`}>{tier.summary}</p>
            <div className="mb-1 flex items-baseline gap-1">
              <span className={`font-serif text-5xl ${tier.recommended ? 'text-white' : 'text-navy'}`}>{tier.price}</span>
              <span className={`text-sm ${tier.recommended ? 'text-white/60' : 'text-navy/60'}`}>/month</span>
            </div>
            <p className={`mb-7 text-xs ${tier.recommended ? 'text-white/55' : 'text-navy/50'}`}>
              Billed monthly · cancel at any time
            </p>
            <ul className={`mb-10 flex-1 space-y-4 text-sm ${tier.recommended ? 'text-white/90' : 'text-navy/70'}`}>
              {tier.features.map(feature => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-bold" aria-hidden="true">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href={KO_FI_MEMBERSHIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={tier.recommended
                ? 'inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-navy transition-colors hover:bg-white/90'
                : 'inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-5 py-3 text-center text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white'}
            >
              {tier.ctaLabel}
            </a>
          </article>
        </CardReveal>
      );
    })}
  </div>
);
