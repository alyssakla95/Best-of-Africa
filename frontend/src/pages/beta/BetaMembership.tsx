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
  const { t } = useLanguage();

  const faqItems = [
    { q: t('membership.access_q', 'Do higher tiers unlock more reader features?'), a: t('membership.access_a', 'No. Every paid tier receives the complete reader product. Higher levels are voluntary support choices, not artificial feature restrictions.') },
    { q: t('landing.faq2_q', 'Can I cancel?'), a: t('landing.faq2_a', 'Yes, you can cancel at any time from your Ko-fi dashboard, no lock-in periods.') },
    { q: t('membership.proof_q', 'What is proven today?'), a: t('membership.proof_a', 'The deployed product, published material and source links can be inspected now. BOA-Story does not present unverified subscriber numbers, testimonials or independent outcome claims.') },
  ];

  return (
    <div className="selection:bg-accent selection:text-primary">
      <SEO 
        title="Membership | BOA-Story" 
        description="Complete BOA-Story reader access from US$4 per month at transparent introductory pricing."
      />
      

      {/* Tiers */}
      <section className="py-12 md:py-16 px-6 max-w-6xl mx-auto">
        <div className="app-hero mb-12 max-w-4xl rounded-lg p-6 text-left sm:p-8 md:p-10">
          <h1 className="font-serif text-[32px] md:text-[44px] leading-tight mb-4">{t('membership.title', 'Complete reader access from US$4 a month')}</h1>
          <p className="text-base md:text-lg text-primary/70 max-w-2xl leading-relaxed mb-8">
            {t('membership.subtitle', 'Introductory pricing while BOA-Story earns its track record. Every paid tier receives the same complete reader product; choose a higher level only if you want to support broader coverage.')}
          </p>

          <p className="text-sm font-semibold text-navy/65">{t('membership.billing', 'Simple monthly billing · cancel at any time')}</p>
        </div>
        <MembershipTiersGrid />
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-7 text-navy/60">
          {t('membership.preview_note', 'Member content is temporarily open during preview. Pricing is shown now so the eventual offer is clear before payment is required.')}
        </p>
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
