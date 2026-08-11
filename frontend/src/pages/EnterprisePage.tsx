import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FileSearch,
  Gauge,
  MapPinned,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { useLanguage } from '@/context/LanguageContext';

const workflow = [
  {
    number: '01',
    title: 'Frame the decision',
    copy: 'Define the expansion question, target sector, candidate countries, time horizon, decision owner and evidence threshold before research begins.',
  },
  {
    number: '02',
    title: 'Build the evidence file',
    copy: 'Assemble official indicators, attributed reporting, trade evidence, operating conditions and dated source records for each candidate market.',
  },
  {
    number: '03',
    title: 'Compare without false precision',
    copy: 'Separate directly comparable indicators from proxies, identify contradictions and show where the evidence is too thin to support a conclusion.',
  },
  {
    number: '04',
    title: 'Prepare the decision brief',
    copy: 'Deliver a plain-language comparison, risk register, opportunity conditions, source ledger and prioritized diligence questions.',
  },
  {
    number: '05',
    title: 'Monitor what could change',
    copy: 'Track new evidence, policy developments and execution signals against the assumptions recorded in the original decision file.',
  },
];

const deliverables = [
  ['Market-entry question', 'A written decision statement, scope, assumptions and exclusions agreed at the start.'],
  ['Three-country evidence dossier', 'A dated comparison of up to three candidate markets for one target sector.'],
  ['Executive decision brief', 'A concise finding with evidence boundaries, counter-signals and unresolved questions.'],
  ['Claim and source ledger', 'A traceable record connecting material conclusions to the evidence supplied.'],
  ['Diligence register', 'Prioritized questions for legal, tax, regulatory, operating and local-market specialists.'],
  ['Closeout review', 'A working session to test whether the evidence is sufficient for the next internal decision.'],
] as const;

const measures = [
  {
    Icon: Gauge,
    title: 'Time to a usable brief',
    copy: 'Record the baseline research cycle and compare it with the pilot delivery cycle.',
  },
  {
    Icon: FileSearch,
    title: 'Evidence traceability',
    copy: 'Measure how many material claims can be followed to a dated, named source record.',
  },
  {
    Icon: Scale,
    title: 'Decision clarity',
    copy: 'Confirm whether decision-makers can distinguish known facts, supported interpretation and unresolved risk.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Diligence readiness',
    copy: 'Count the unanswered questions converted into assigned, testable follow-up work.',
  },
];

const commercialPackages: Array<{
  name: string;
  price: number;
  timing: string;
  description: string;
  inclusions: string[];
  recommended?: boolean;
}> = [
  {
    name: 'Focused market brief',
    price: 750,
    timing: '10 business days',
    description: 'A lower-risk first engagement for one defined question in one country and one sector.',
    inclusions: ['One-country evidence file', 'Decision brief and source ledger', 'Priority diligence questions', '45-minute findings review'],
  },
  {
    name: 'Comparative entry pilot',
    price: 1800,
    timing: 'Four weeks',
    description: 'The complete design-partner pilot for a team choosing between as many as three markets.',
    inclusions: ['Up to three candidate countries', 'All six published pilot deliverables', 'One consolidated revision', '60-minute closeout review'],
    recommended: true,
  },
  {
    name: 'Monitoring extension',
    price: 300,
    timing: 'per month',
    description: 'Post-pilot monitoring of the assumptions and signals recorded in the completed decision file.',
    inclusions: ['Weekly source monitoring', 'Monthly change memorandum', 'Material-signal alerts', 'Cancel before the next month'],
  },
];

const sectionLinks = [
  ['Who it is for', 'fit'],
  ['Decision workflow', 'workflow'],
  ['Pilot scope', 'pilot'],
  ['Introductory pricing', 'pricing'],
  ['Success measures', 'measures'],
  ['Commercial status', 'status'],
] as const;

const PRICE_LOCALES = {
  en: 'en-US', fr: 'fr-FR', pt: 'pt-PT', ar: 'ar', de: 'de-DE', zh: 'zh-CN', hi: 'hi-IN',
} as const;

export const EnterprisePage = () => {
  const { language } = useLanguage();
  const priceFormatter = new Intl.NumberFormat(PRICE_LOCALES[language] || 'en-US', { maximumFractionDigits: 0 });

  return (
  <div className="bg-white text-navy">
    <SEO
      title="African Market-Entry Intelligence for Global Organizations"
      description="A focused BOA-Story pilot for organizations comparing African markets, documenting risks and preparing evidence-backed entry decisions."
    />

    <section className="border-b border-white/15 bg-navy text-white">
      <div className="page-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-white/65">
            Enterprise market-entry pilot
          </p>
          <h1 className="max-w-4xl font-serif text-[clamp(2.8rem,6vw,5.4rem)] leading-[1.01] text-white">
            Make an African market-entry decision with evidence you can trace.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/75 md:text-xl">
            BOA-Story helps companies, investors, institutions and their advisers compare candidate African markets,
            identify what is known, expose what is missing and prepare the next diligence decision
            before capital or operating commitments are made.
          </p>
          <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              to="/enterprise/apply"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-white/90"
            >
              Discuss a pilot <ArrowRight size={17} />
            </Link>
            <Link
              to="/trust"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Review trust disclosures
            </Link>
            <Link
              to="/enterprise/access"
              className="inline-flex min-h-12 items-center justify-center px-3 py-3 text-sm font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              Existing Enterprise client sign in
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/20 bg-white/[0.08] p-6 md:p-8" aria-label="Primary buyer and decision">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Primary buyer</p>
          <p className="mt-3 text-xl font-semibold text-white">Corporate strategy, investment, growth and market-entry teams worldwide</p>
          <div className="my-6 h-px bg-white/15" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Recurring decision</p>
          <p className="mt-3 leading-7 text-white/80">
            Which country and sector conditions justify deeper entry diligence, and which risks must be resolved first?
          </p>
          <div className="my-6 h-px bg-white/15" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Product state</p>
          <p className="mt-3 leading-7 text-white/80">
            Production-deployed and ready for a bounded design-partner pilot with measurable decision criteria.
          </p>
        </aside>
      </div>
    </section>

    <nav aria-label="Enterprise page sections" className="sticky top-[4.5rem] z-30 border-b border-border bg-white/95 backdrop-blur lg:top-[4.75rem]">
      <div className="page-container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
        {sectionLinks.map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-lg border border-border px-4 py-2 text-xs font-bold text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>

    <section id="fit" className="scroll-mt-40 border-b border-border">
      <div className="page-container grid gap-10 py-14 md:py-20 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Who it is for</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl text-navy md:text-5xl">One buyer, one consequential decision.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
            <Building2 className="text-navy" size={25} />
            <h3 className="mt-5 text-xl font-bold text-navy">Good pilot fit</h3>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-navy/70">
              {[
                'An organization comparing two or three African markets for expansion, investment or partnership.',
                'One named sector, decision owner and internal deadline.',
                'A need to reconcile fragmented public evidence before specialist diligence.',
                'A team willing to test usefulness against an existing research process.',
              ].map(item => <li key={item} className="flex gap-3"><Check className="mt-1 shrink-0" size={16} />{item}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-navy p-6 text-white md:p-8">
            <ShieldCheck size={25} />
            <h3 className="mt-5 text-xl font-bold text-white">Not represented as</h3>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-white/75">
              {[
                'Investment, legal, tax or regulatory advice.',
                'A substitute for in-country counsel or commercial diligence.',
                'Comprehensive coverage of every African market and sector.',
                'A source of guaranteed forecasts, rankings or business outcomes.',
              ].map(item => <li key={item} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="workflow" className="scroll-mt-40 bg-white">
      <div className="page-container py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Decision workflow</p>
          <h2 className="mt-3 font-serif text-4xl text-navy md:text-5xl">From expansion question to diligence plan.</h2>
          <p className="mt-5 text-lg leading-8 text-navy/70">
            The product is organized around a recurring market-entry decision, not around producing more information.
          </p>
        </div>
        <ol className="mt-10 grid gap-4 lg:grid-cols-5">
          {workflow.map(step => (
            <li key={step.number} className="rounded-3xl border border-border p-6">
              <span className="text-sm font-black text-navy/40">{step.number}</span>
              <h3 className="mt-6 text-lg font-bold text-navy">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-navy/70">{step.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section id="pilot" className="scroll-mt-40 border-y border-border bg-navy text-white">
      <div className="page-container py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Pilot scope</p>
            <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">A bounded four-week evidence pilot.</h2>
            <p className="mt-5 max-w-xl leading-8 text-white/70">
              One target sector, up to three candidate countries and one internal decision. The boundary is deliberate:
              it makes usefulness measurable and prevents broad platform capability from hiding a weak commercial outcome.
            </p>
            <div className="mt-8 rounded-2xl border border-white/20 p-5">
              <p className="text-sm font-bold text-white">Commercial terms</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                Introductory design-partner pricing is published below. Applying is free; suitable work proceeds only after
                a written scope, evidence-access check and signed agreement. No outcome, forecast or acceptance is guaranteed.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {deliverables.map(([title, copy]) => (
              <div key={title} className="rounded-3xl border border-white/20 bg-white/5 p-6">
                <MapPinned size={20} className="text-white" />
                <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" className="scroll-mt-40 border-b border-border bg-white">
      <div className="page-container py-14 md:py-20">
        <div className="grid gap-7 lg:grid-cols-[1fr_.72fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Introductory design-partner pricing</p>
            <h2 className="mt-3 font-serif text-4xl text-navy md:text-5xl">A defined decision, a visible fee and limited buyer risk.</h2>
            <p className="mt-5 text-lg leading-8 text-navy/70">
              BOA-Story does not yet claim verified client outcomes or an independent commercial track record. These prices
              reflect that stage while preserving a professional, tightly bounded research engagement.
            </p>
          </div>
          <div className="rounded-3xl border border-navy/15 bg-navy/[0.03] p-6 text-sm leading-7 text-navy/70">
            <p className="font-bold text-navy">Payment terms</p>
            <p className="mt-2">No application fee. Fixed-scope work is billed 50% at commencement and 50% on delivery. Taxes, paid datasets, travel and external specialist advice are excluded unless separately agreed.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {commercialPackages.map(plan => (
            <article key={plan.name} className={`relative flex h-full flex-col rounded-3xl border p-7 md:p-8 ${plan.recommended ? 'border-navy bg-navy text-white' : 'border-navy/15 bg-white text-navy'}`}>
              {plan.recommended && <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">Recommended first pilot</span>}
              <p className={`text-xs font-bold uppercase tracking-[0.14em] ${plan.recommended ? 'text-white/60' : 'text-navy/55'}`}>{plan.timing}</p>
              <h3 className={`mt-4 font-serif text-3xl ${plan.recommended ? 'text-white' : 'text-navy'}`}>{plan.name}</h3>
              <p className="mt-5 font-serif text-5xl" data-no-translate>US${priceFormatter.format(plan.price)}</p>
              <p className={`mt-5 text-sm leading-7 ${plan.recommended ? 'text-white/70' : 'text-navy/65'}`}>{plan.description}</p>
              <ul className={`mt-7 flex-1 space-y-3 text-sm ${plan.recommended ? 'text-white/85' : 'text-navy/70'}`}>
                {plan.inclusions.map(item => <li key={item} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0" />{item}</li>)}
              </ul>
              <Link to="/enterprise/apply" className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-colors ${plan.recommended ? 'bg-white text-navy hover:bg-white/90' : 'border border-navy text-navy hover:bg-navy hover:text-white'}`}>
                Define the scope
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-navy/60">
          Introductory prices apply only to the stated scope and may change after the design-partner phase. Any different scope receives a written quotation before commitment.
        </p>
      </div>
    </section>

    <section id="measures" className="scroll-mt-40 border-b border-border">
      <div className="page-container py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Success measures</p>
          <h2 className="mt-3 font-serif text-4xl text-navy md:text-5xl">Measure usefulness before claiming value.</h2>
          <p className="mt-5 text-lg leading-8 text-navy/70">
            These are pilot measurement categories, not published customer results. Baselines and targets are agreed with each design partner.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {measures.map(({ Icon, title, copy }) => (
            <article key={title} className="rounded-3xl border border-border p-6">
              <Icon size={22} className="text-navy" />
              <h3 className="mt-5 text-lg font-bold text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-navy/70">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="status" className="scroll-mt-40">
      <div className="page-container py-14 md:py-20">
        <div className="grid gap-8 rounded-3xl border border-border p-7 md:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Commercial status</p>
            <h2 className="mt-3 font-serif text-3xl text-navy md:text-4xl">Ready for a measurable design-partner pilot.</h2>
            <p className="mt-4 leading-8 text-navy/70">
              BOA-Story combines deployed software, evidence controls and client infrastructure in a fixed decision scope.
              Each pilot records its research baseline, delivery cycle, evidence traceability and unresolved diligence work
              so the participating organization can assess practical value against its existing process.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/enterprise/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy/90">
              Apply for a pilot <ArrowRight size={16} />
            </Link>
            <Link to="/trust" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-6 py-3 text-sm font-bold text-navy hover:bg-navy hover:text-white">
              Open Trust Center
            </Link>
            <Link to="/enterprise/access" className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-navy underline underline-offset-4">
              Open client workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  </div>
  );
};

export default EnterprisePage;
