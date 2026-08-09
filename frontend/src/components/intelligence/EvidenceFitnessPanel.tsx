type EvidenceSeries = {
  label: string;
  coveragePct: number;
  periodStart: number;
  periodEnd: number;
};

type Props = {
  series: EvidenceSeries[];
  language: string;
};

export const EvidenceFitnessPanel = ({ series, language }: Props) => {
  if (!series.length) return null;
  const pt = language === 'pt';
  const broad = series.filter(item => item.coveragePct >= 80);
  const partial = series.filter(item => item.coveragePct >= 60 && item.coveragePct < 80);
  const thin = series.filter(item => item.coveragePct < 60);
  const oldest = Math.min(...series.map(item => item.periodStart));
  const newest = Math.max(...series.map(item => item.periodEnd));
  const lowest = [...series].sort((a, b) => a.coveragePct - b.coveragePct).slice(0, 4);

  const copy = pt ? {
    eyebrow: 'Adequação da evidência', title: 'O que pode ser comparado com confiança — e onde deve parar',
    intro: 'Esta leitura não é uma classificação de mercados. Separa a amplitude geográfica do período de observação para mostrar onde uma comparação continental é robusta, parcial ou demasiado limitada.',
    broad: 'Cobertura ampla', partial: 'Cobertura parcial', thin: 'Cobertura limitada',
    period: 'Período total das observações', weakest: 'Séries que exigem maior prudência',
    use: 'Utilização prática', useBody: 'Comece pelas séries de cobertura ampla para enquadrar a comparação. Nas séries parciais, confirme quais os países ausentes. Não utilize uma série limitada como conclusão continental; abra a fonte e os registos nacionais antes de tomar uma decisão.',
    seriesLabel: 'séries', countries: 'dos países',
  } : {
    eyebrow: 'Evidence fitness', title: 'What can be compared confidently—and where to stop',
    intro: 'This is not a market rating. It separates geographic breadth from observation period so readers can see where a continental comparison is broad, partial or too limited.',
    broad: 'Broad coverage', partial: 'Partial coverage', thin: 'Limited coverage',
    period: 'Full observation range', weakest: 'Series requiring the most caution',
    use: 'Practical use', useBody: 'Start with broad-coverage series to frame a comparison. For partial series, identify the missing countries. Do not use a limited series as a continental conclusion; open the source and country records before making a decision.',
    seriesLabel: 'series', countries: 'of countries',
  };

  return <section className="page-section overflow-hidden rounded-2xl border border-border bg-white" aria-labelledby="evidence-fitness-title">
    <div className="grid gap-5 border-b border-border px-5 py-6 md:grid-cols-[1fr_.75fr] md:px-8">
      <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">{copy.eyebrow}</p><h2 id="evidence-fitness-title" className="mt-2 font-serif text-3xl text-navy md:text-4xl">{copy.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{copy.intro}</p></div>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border self-start">
        {[[copy.broad,broad.length],[copy.partial,partial.length],[copy.thin,thin.length]].map(([label,value]) => <div key={label} className="bg-background p-3 text-center"><dt className="text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">{label}</dt><dd className="mt-2 font-serif text-3xl text-navy">{value}</dd><p className="text-[9px] text-muted-foreground">{copy.seriesLabel}</p></div>)}
      </dl>
    </div>
    <div className="grid gap-6 px-5 py-6 md:grid-cols-2 md:px-8">
      <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{copy.period}</p><p className="mt-2 font-serif text-3xl text-navy">{oldest === newest ? newest : `${oldest}–${newest}`}</p><p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{copy.weakest}</p><ul className="mt-3 space-y-2">{lowest.map(item => <li key={`${item.label}-${item.periodEnd}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-navy/[.035] px-3 py-2 text-xs"><span className="font-semibold text-navy">{item.label}</span><span className="text-right tabular-nums text-muted-foreground">{item.coveragePct.toFixed(0)}% {copy.countries}<br/>{item.periodStart === item.periodEnd ? item.periodEnd : `${item.periodStart}–${item.periodEnd}`}</span></li>)}</ul></div>
      <div className="rounded-xl bg-navy p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/60">{copy.use}</p><p className="mt-3 text-sm leading-7 text-white/80">{copy.useBody}</p><div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 text-center text-[10px] text-white/65"><span><strong className="block font-serif text-2xl text-white">≥80%</strong>{copy.broad}</span><span><strong className="block font-serif text-2xl text-white">60–79%</strong>{copy.partial}</span><span><strong className="block font-serif text-2xl text-white">&lt;60%</strong>{copy.thin}</span></div></div>
    </div>
  </section>;
};
