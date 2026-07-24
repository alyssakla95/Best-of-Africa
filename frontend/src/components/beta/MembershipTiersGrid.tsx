import { CardReveal } from './CardReveal';
import { GoldButton } from './GoldButton';
import { MEMBERSHIP_TIERS, KO_FI_URL } from '../../constants/beta';

// Annual prices (monthly × 10 = ~2 months free)
const ANNUAL_PRICES: Record<string, string> = {
  supporter: '$50',
  founding: '$150',
  partner: '$500',
};

interface MembershipTiersGridProps {
  isAnnual?: boolean;
}

/**
 * Renders the three membership tier cards.
 * Used in both BetaLanding (inside a larger section) and BetaMembership (standalone page).
 * Accepts optional isAnnual prop to display annual pricing.
 */
export const MembershipTiersGrid = ({ isAnnual = false }: MembershipTiersGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
    {MEMBERSHIP_TIERS.map((tier, i) => {
      const displayPrice = isAnnual ? (ANNUAL_PRICES[tier.id] || tier.price) : tier.price;
      const monthlyRef = isAnnual ? tier.price : null;

      return (
        <CardReveal key={tier.id} delay={i * 0.15}>
          {tier.recommended ? (
            // Featured / recommended card, elevated with gold border
            <div className="bg-navy text-white border-t-4 border-accent rounded-2xl p-8 md:p-10 relative flex flex-col h-full md:-translate-y-4 shadow-[0_20px_50px_rgba(15,31,61,0.25)] z-10 hover:shadow-[0_24px_60px_rgba(15,31,61,0.22)] hover:-translate-y-5 transition-all duration-300">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-navy text-[10px] font-bold uppercase tracking-widest py-1 px-5 rounded-full shadow-lg whitespace-nowrap">
                Recommended
              </div>
              <h3 className="font-serif text-2xl mb-2 mt-2 text-white">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-accent font-serif text-5xl">{displayPrice}</span>
                <span className="text-white/60 text-sm">/{isAnnual ? 'yr' : 'mo'}</span>
              </div>
              {monthlyRef && (
                <p className="text-white/50 text-xs mb-7 line-through">{monthlyRef}/mo billed monthly</p>
              )}
              {!monthlyRef && <div className="mb-7" />}
              <ul className="space-y-3 mb-10 flex-1 text-sm text-white/90">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
                <GoldButton variant="primary" className="w-full shadow-[0_0_20px_rgba(15,31,61,0.3)]">
                  {tier.ctaLabel}
                </GoldButton>
              </a>
            </div>
          ) : (
            // Standard card
            <div className="glass-panel border border-foreground/5 rounded-3xl p-8 md:p-10 flex flex-col h-full hover:border-accent/30 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(15,31,61,0.08)] transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="font-serif text-[1.5rem] md:text-[2rem] mb-2 text-foreground/90 group-hover:text-foreground transition-colors">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-accent-ink font-serif text-4xl drop-shadow-md">{displayPrice}</span>
                <span className="text-foreground/70 text-sm">/{isAnnual ? 'yr' : 'mo'}</span>
              </div>
              {monthlyRef && (
                <p className="text-foreground/70 text-xs mb-7 line-through font-medium tracking-wide">{monthlyRef}/mo billed monthly</p>
              )}
              {!monthlyRef && <div className="mb-7" />}
              <ul className="space-y-4 mb-10 flex-1 text-[0.9rem] text-foreground/70">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="text-accent mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="relative z-10">
                <GoldButton variant="ghost" className="w-full border-foreground/10 text-foreground/70 hover:text-foreground hover:border-accent/50 hover:bg-foreground/5 transition-all">
                  {tier.ctaLabel}
                </GoldButton>
              </a>
            </div>
          )}
        </CardReveal>
      );
    })}
  </div>
);
