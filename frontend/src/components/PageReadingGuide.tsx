import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, CircleHelp, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePortugueseCatalogue } from '../i18n/usePortugueseCatalogue';

type Guide = {
  label: string;
  title: string;
  purpose: string;
  outcome: string;
  steps: string[];
  terms: Array<[string, string]>;
};

const guideForPath = (pathname: string): Guide => {
  if (pathname.startsWith('/intelligence') || pathname.startsWith('/sectors/')) {
    return {
      label: 'Market-intelligence guide',
      title: 'Understand sector performance without specialist training.',
      purpose: 'This page compares named measures of output, demand, access, capacity, cost and operating conditions. It does not turn unlike evidence into a single unsupported score.',
      outcome: 'You should leave knowing what changed, how widespread it was, how countries differ, how recent the evidence is and which questions still need investigation.',
      steps: [
        'Identify the main performance measure and read its exact unit.',
        'Separate scale from growth: a large market can grow slowly, while a small market can grow quickly.',
        'Use country coverage and the middle-half range to see whether a continental figure is broadly representative.',
        'Compare the supporting measures separately; access, cost, infrastructure and output do not mean the same thing.',
        'Check the period and previous observation before describing a movement as current or sustained.',
        'Read the limitation and diligence questions before treating the evidence as an opportunity, risk or recommendation.',
      ],
      terms: [
        ['Performance proxy', 'A measurable indicator used to represent one part of sector activity; it is not the whole sector.'],
        ['Median', 'The middle country after values are ordered, giving each reporting country equal weight.'],
        ['Breadth', 'How many comparable countries moved in the stated direction.'],
        ['Dispersion', 'How far country readings are spread apart rather than clustered around one value.'],
      ],
    };
  }

  if (pathname.startsWith('/dashboards')) {
    return {
      label: 'Continental-data guide',
      title: 'Read Africa-wide economic evidence carefully and confidently.',
      purpose: 'This page brings together official economic, population, trade, price, investment and sector measures. Some figures are country totals; others describe the middle reporting country.',
      outcome: 'You should be able to distinguish economic size from living standards, nominal values from real growth, and a regional total from a typical-country reading.',
      steps: [
        'Start with the indicator name, unit and aggregation method shown on the card.',
        'Check whether the figure is a total, median, percentage or per-person value.',
        'Read the number of reporting countries and observation years before calling it continental.',
        'Compare countries or regions only on the same indicator, unit and reasonably aligned period.',
        'Use the plain-language interpretation to understand the result, then read the stated caveat.',
        'Open the official source before using a figure in a consequential business or policy decision.',
      ],
      terms: [
        ['Nominal value', 'A value measured in current prices; inflation and exchange rates can affect comparisons over time.'],
        ['Real growth', 'Change after adjusting for price movements, intended to show changes in actual output.'],
        ['Aggregation', 'The rule used to combine country observations, such as a total or median.'],
        ['Coverage', 'The share of Africa’s 54 countries represented by usable observations.'],
      ],
    };
  }

  if (pathname.startsWith('/countries/')) {
    return {
      label: 'Country-dossier guide',
      title: 'Build a country view from facts, change and context.',
      purpose: 'The dossier combines dated country indicators, sector evidence, trade and economic context, and linked sources. Each section answers a different question about the country.',
      outcome: 'You should understand the country’s scale, recent direction, structural strengths, constraints and the age and coverage of the supporting evidence.',
      steps: [
        'Confirm the country, latest observation date and source.',
        'Read the plain-language overview before comparing detailed measures.',
        'Separate current conditions from longer-term structural characteristics.',
        'Keep currency totals, percentages and per-person figures in their own units.',
        'Use sector and trade sections to add context rather than infer causation.',
        'Open primary sources and compare countries on like-for-like periods for important decisions.',
      ],
      terms: [
        ['Latest observation', 'The newest available official value, which may predate today because reporting is delayed.'],
        ['Per capita', 'A total divided by population, useful for scale-adjusted comparison.'],
        ['Structural', 'A persistent feature of an economy rather than a short-term movement.'],
        ['Source date', 'When the underlying observation was measured, not merely when this page retrieved it.'],
      ],
    };
  }

  if (pathname.startsWith('/posts/') || pathname.startsWith('/feed') || pathname.startsWith('/posts')) {
    return {
      label: 'Story and briefing guide',
      title: 'Separate established facts, analysis and open questions.',
      purpose: 'Stories and briefings explain events using named actors, dates, evidence and context. Analysis can clarify significance without turning uncertainty into fact.',
      outcome: 'You should understand what happened, why it matters, which claims are directly supported and what remains uncertain or contested.',
      steps: [
        'Read the publication date, update date and central summary.',
        'Identify the event, decision or evidence that supports the headline.',
        'Distinguish direct facts and attributed claims from interpretation.',
        'Check source links and the dates of the evidence.',
        'Use related context to understand what preceded the event.',
        'Treat forecasts and implications as conditional, not guaranteed outcomes.',
      ],
      terms: [
        ['Attribution', 'Naming who supplied a claim, estimate or opinion.'],
        ['Analysis', 'Reasoned interpretation of evidence rather than a newly observed fact.'],
        ['Primary source', 'The original institution, filing, dataset, speech or document behind a claim.'],
        ['Uncertainty', 'What the available evidence cannot yet establish confidently.'],
      ],
    };
  }

  return {
    label: 'Page guide',
    title: 'Understand what this page offers and how to use it.',
    purpose: 'The introduction explains the page’s purpose. Major sections move from overview to detail, while links and controls let you inspect the underlying content.',
    outcome: 'You should be able to find the main information, understand its context and move to the relevant story, country, event or intelligence page.',
    steps: [
      'Read the title and introduction to confirm the page’s purpose.',
      'Use the sticky main navigation and section navigation on long pages.',
      'Begin with summaries, then open supporting detail when needed.',
      'Check labels, dates and sources before relying on a claim.',
      'Use clear action links to continue to the next relevant page.',
      'Return to this guide whenever an unfamiliar term or structure appears.',
    ],
    terms: [
      ['Overview', 'A concise orientation to the page, not a replacement for its supporting detail.'],
      ['Source', 'The publisher, institution or dataset from which information was obtained.'],
      ['Context', 'Background needed to understand why a fact or event matters.'],
      ['Updated', 'When the page or dataset was most recently refreshed.'],
    ],
  };
};

export function PageReadingGuide() {
  const { pathname } = useLocation();
  const guide = useMemo(() => guideForPath(pathname), [pathname]);
  const [manualState, setManualState] = useState<{ path: string; open: boolean } | null>(null);
  const open = manualState?.path === pathname ? manualState.open : false;

  return <section className="border-b border-border bg-white" aria-label="Plain-language page guide">
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <button type="button" onClick={() => setManualState({ path: pathname, open: !open })} aria-expanded={open} aria-controls="plain-language-page-guide" className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left text-sm text-navy">
        <span className="flex min-w-0 items-start gap-3"><BookOpen size={19} className="mt-0.5 shrink-0"/><span><strong className="block sm:inline">{guide.label}</strong><span className="hidden sm:inline">: </span><span className="block text-muted-foreground sm:inline">{guide.title}</span></span></span>
        <span className="flex shrink-0 items-center gap-2 font-semibold"><span className="hidden md:inline">{open ? 'Hide guide' : 'Open guide'}</span><ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true"/></span>
      </button>
      {open && <div id="plain-language-page-guide" className="border-t border-border py-6 md:py-8">
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-10">
          <div><p className="text-xs font-bold uppercase tracking-[.08em] text-navy/60">What this page is for</p><p className="mt-2 readable-copy">{guide.purpose}</p></div>
          <div className="relative rounded-xl bg-navy/[.04] p-4 pr-12 sm:p-5 sm:pr-12"><p className="text-xs font-bold uppercase tracking-[.08em] text-navy/60">What you should understand</p><p className="mt-2 text-sm leading-6 text-navy/85">{guide.outcome}</p><button type="button" onClick={() => setManualState({ path: pathname, open: false })} className="absolute right-3 top-3 rounded-full p-2 text-navy/55 hover:bg-white" aria-label="Close page guide"><X size={17}/></button></div>
        </div>
        <h2 className="mt-8 text-lg font-bold text-navy">A reliable reading order</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{guide.steps.map((step,index) => <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-navy/85"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><span>{step}</span></li>)}</ol>
        <div className="mt-7 border-t border-border pt-6"><div className="flex items-center gap-2"><CircleHelp size={18} className="text-navy/65"/><h2 className="text-lg font-bold text-navy">Useful terms on this page</h2></div><dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">{guide.terms.map(([term,meaning]) => <div key={term}><dt className="text-sm font-bold text-navy">{term}</dt><dd className="mt-1 text-xs leading-5 text-muted-foreground">{meaning}</dd></div>)}</dl></div>
      </div>}
    </div>
  </section>;
}

const analyticalPrimer = (subject: string) => {
  if (subject.includes('continental')) return {
    title: 'Three distinctions that prevent misleading conclusions',
    points: [
      ['Size is not prosperity', 'Total GDP describes economic scale. GDP per person answers a different question and still does not directly measure household income or wellbeing.'],
      ['Nominal is not real', 'Current-dollar values move with prices and exchange rates. Real growth is designed to show changes in output after adjusting for price movements.'],
      ['Total is not typical', 'A continental or regional total can be dominated by large economies. A median describes the middle reporting country instead.'],
    ],
  };
  if (subject.includes('market-intelligence')) return {
    title: 'How the performance framework fits together',
    points: [
      ['Main measure', 'The headline indicator captures one observable part of sector performance. Read its scope before treating it as a description of the entire sector.'],
      ['Supporting dimensions', 'Access, cost, capacity, infrastructure and demand help explain operating conditions, but their different units must remain separate.'],
      ['Country distribution', 'Coverage, breadth and the middle-half range show whether the headline reflects many countries or hides substantial differences.'],
    ],
  };
  return {
    title: 'How to build a complete sector view',
    points: [
      ['Level', 'The latest value shows the recorded level for the named measure, not whether the sector is universally strong or weak.'],
      ['Change', 'The comparison shows direction from the previous available observation; it may not represent exactly one calendar year.'],
      ['Context', 'Country range, coverage, supporting indicators and diligence questions explain how much confidence and practical meaning to attach to the result.'],
    ],
  };
};

export function DataReadingGuide({ subject = 'this dashboard' }: { subject?: string }) {
  const { language } = useLanguage();
  const translatePortugueseInterfaceText = usePortugueseCatalogue(language === 'pt');
  const text = (value: string) => language === 'pt' ? (translatePortugueseInterfaceText(value) || value) : value;
  const subjectLabel = language === 'pt'
    ? subject.includes('sector') ? 'este guia sectorial' : subject.includes('continental') ? 'este panorama continental' : 'este painel'
    : subject;
  const primer = analyticalPrimer(subject);
  return <section className="page-section overflow-hidden rounded-2xl border border-navy/15 bg-white" aria-labelledby="data-reading-guide-title">
    <div className="border-b border-border bg-navy/[.035] px-5 py-6 md:px-8 md:py-7">
      <p className="text-xs font-bold uppercase tracking-[.08em] text-navy/60">Start here · no specialist background required</p>
      <h2 id="data-reading-guide-title" className="mt-2 font-serif text-3xl text-navy md:text-4xl">{language === 'pt' ? `Como ler ${subjectLabel}` : `How to read ${subjectLabel}`}</h2>
      <p className="mt-4 readable-copy">{text('Read evidence in layers: definition, value, comparison, coverage, time period and limitation. This stops a large number, positive movement or high ranking from being mistaken for a complete conclusion.')}</p>
    </div>
    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
      {[
        ['1', 'Definition', 'What exactly is measured, and what part of the economy or sector does it represent?'],
        ['2', 'Value and unit', 'Is it a dollar total, percentage, percentage-point change, number of people or per-person value?'],
        ['3', 'Comparison', 'Is the page comparing countries, periods, a median, a total or a previous observation?'],
        ['4', 'Coverage', 'How many countries supplied usable data, and could missing countries change the continental picture?'],
        ['5', 'Timing', 'Which years are represented, and do reporting delays limit claims about conditions today?'],
        ['6', 'Boundary', 'What can the indicator support, and what requires other evidence or professional diligence?'],
      ].map(([number,title,body]) => <article key={number} className="bg-white p-5 md:p-6"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{number}</span><h3 className="mt-4 text-base font-bold text-navy">{text(title)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text(body)}</p></article>)}
    </div>
    <div className="border-t border-border p-5 md:p-8"><h3 className="text-xl font-bold text-navy">{text(primer.title)}</h3><div className="mt-5 grid gap-4 lg:grid-cols-3">{primer.points.map(([title,body]) => <article key={title} className="rounded-xl bg-navy/[.035] p-4 md:p-5"><h4 className="text-base font-bold text-navy">{text(title)}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{text(body)}</p></article>)}</div></div>
    <div className="border-t border-border bg-navy px-5 py-6 text-white md:px-8">
      <p className="text-xs font-bold uppercase tracking-[.08em] text-white/65">Worked example</p>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-white/85"><strong className="text-white">“Median real growth: 4.2%, 39 countries, observations from 2023–2024”</strong> means the middle reported country recorded 4.2% real growth. It does not mean every country grew by 4.2%, that Africa’s combined economy grew at that exact rate, or that the same conditions persisted after the observation period.</p>
    </div>
    <dl className="grid gap-4 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-8">
      {[
        ['Median', 'The middle country after values are ordered. It is not the total or arithmetic average.'],
        ['Coverage', 'The share of Africa’s 54 countries with usable observations for that indicator.'],
        ['Prior observation', 'The previous available value for each country; it may not be exactly one year earlier.'],
        ['Percentage point (pp)', 'The direct difference between percentages: 10% to 12% is +2 pp, not +2%.'],
      ].map(([term,meaning]) => <div key={term}><dt className="text-sm font-bold text-navy">{text(term)}</dt><dd className="mt-1 text-xs leading-5 text-muted-foreground">{text(meaning)}</dd></div>)}
    </dl>
  </section>;
}
