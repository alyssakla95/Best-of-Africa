import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MembershipTiersGrid } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { KO_FI_URL } from '../../constants/beta';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-primary/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="font-medium text-primary/90 group-hover:text-primary transition-colors text-base">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-accent shrink-0" />
          : <ChevronDown size={16} className="text-primary/40 shrink-0 group-hover:text-primary/70 transition-colors" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-primary/70 text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const BetaMembership = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const { t } = useLanguage();

  const faqItems = [
    { q: t('landing.faq1_q', 'Is this finished?'), a: t('landing.faq1_a', 'No. The platform is currently in prototype and pre-launch stage. I am building this iteratively in public. Your early support makes the full launch possible.') },
    { q: t('landing.faq2_q', 'Can I cancel?'), a: t('landing.faq2_a', 'Yes, you can cancel at any time from your Ko-fi dashboard, no lock-in periods.') },
    { q: t('landing.faq3_q', 'Why now?'), a: t('landing.faq3_a', 'Because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy deserves a platform built for it, and it needs independent backing to stay authentic.') },
  ];

  return (
    <div className="selection:bg-accent selection:text-primary">
      <SEO 
        title="Membership | BOA-Story" 
        description="Become a Founding Member to support this independent narrative project."
      />
      

      {/* Tiers */}
      <section className="py-12 md:py-16 px-6 max-w-6xl mx-auto">
        <div className="app-hero mb-12 max-w-4xl rounded-lg p-6 text-left sm:p-8 md:p-10">
          <h1 className="font-serif text-[32px] md:text-[44px] leading-tight mb-4">{t('mem.title', 'Join before the official launch')}</h1>
          <p className="text-base md:text-lg text-primary/70 max-w-2xl leading-relaxed mb-8">
            {t('mem.subtitle', 'Your support right now covers domains, tools, and the time to report and ship.')}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-background border border-primary/8 rounded-full shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !isAnnual ? 'bg-white text-navy shadow-sm' : 'text-primary/70 hover:text-primary'
              }`}
            >
              {t('mem.monthly', 'Monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                isAnnual ? 'bg-white text-navy shadow-sm' : 'text-primary/70 hover:text-primary'
              }`}
            >
              {t('mem.annual', 'Annual')} <span className="text-[10px] bg-accent/20 text-accent-ink px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{t('mem.free_badge', '~2 mo free')}</span>
            </button>
          </div>
        </div>
        <MembershipTiersGrid isAnnual={isAnnual} />
      </section>

    {/* One-off tip */}
    <section className="py-16 px-6 border-t border-primary/8">
      <div className="max-w-xl mx-auto text-center bg-background p-8 rounded-xl border border-primary/8">
        <h3 className="font-serif text-2xl mb-3">{t('mem.support_title', 'Support the work.')}</h3>
        <p className="text-primary/70 text-sm mb-6">{t('mem.support_desc', 'A one-time contribution keeps this reporting independent and brings African stories to the world.')}</p>
        <a
          href={KO_FI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-transparent border border-accent text-accent-ink px-6 py-3 rounded-full hover:bg-accent/10 transition-colors"
        >
          {t('mem.one_time', 'One-time contribution')}
        </a>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-16 px-6 border-t border-primary/8">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl text-primary mb-10 text-center">{t('mem.faq_title', 'Questions about membership')}</h2>
        <div className="bg-background rounded-2xl border border-primary/8 px-6 md:px-8">
          {faqItems.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
        </div>
      </div>
    </section>

      
    </div>
  );
};
