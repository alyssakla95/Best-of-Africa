import { Check, ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const implementedControls = [
  'Administrative routes require an administrator key or administrator-authorized token.',
  'Client passwords and API keys are stored as hashes; newly provisioned raw API keys are returned once.',
  'State-changing browser requests are protected by origin and CSRF checks.',
  'Production error responses use request identifiers and do not return internal exception details.',
  'Content is quarantined until a separate source-grounded editorial audit approves publication.',
  'Translation, audio, reporting and publication outputs are checked through deep health, not binding reachability alone.',
  'Scheduled jobs are isolated so one provider failure does not terminate unrelated maintenance work.',
  'Deployment secrets and generated Cloudflare account bindings are excluded from source control.',
];

const disclosures = [
  {
    area: 'SOC 2 and ISO 27001',
    status: 'Not certified',
    detail: 'BOA-Story does not currently claim SOC 2 or ISO 27001 certification.',
  },
  {
    area: 'Independent penetration test',
    status: 'Not yet claimed',
    detail: 'No current third-party penetration-test report or attestation is published.',
  },
  {
    area: 'Data-processing agreement',
    status: 'Not standardized',
    detail: 'A production DPA is not presently offered as a standard self-serve document. Pilot data requirements must be reviewed before contract.',
  },
  {
    area: 'Service-level agreement',
    status: 'No public SLA',
    detail: 'The public service has health monitoring and failure isolation, but no contractual uptime or support-response commitment is published.',
  },
  {
    area: 'Accessibility conformance',
    status: 'No external attestation',
    detail: 'The product uses responsive layouts, keyboard-focus states and semantic controls, but no VPAT or independent WCAG audit is claimed.',
  },
  {
    area: 'Business continuity',
    status: 'Technical resilience implemented',
    detail: 'The platform uses Cloudflare-managed services, queues, retries, fallbacks and internal recovery. A customer-facing BCP/DR policy is not yet published.',
  },
  {
    area: 'Source and model risk',
    status: 'Controls documented',
    detail: 'Attribution, evidence boundaries, editorial audit, translation validation and process-leakage checks are implemented. No external model-risk assurance is claimed.',
  },
  {
    area: 'Insurance and legal assurance',
    status: 'Not represented',
    detail: 'No professional-liability coverage, legal opinion or investment-advice authorization is represented on this site.',
  },
];

const dataMap = [
  ['Cloudflare D1', 'Articles, sources, country records, preferences, account records, audit history and operational metadata.'],
  ['Cloudflare KV', 'Cache and session-related values; it also stores media when R2 is unavailable in the selected account.'],
  ['Cloudflare Vectorize', 'Embeddings used for semantic retrieval.'],
  ['Analytics Engine', 'Operational and usage events used to observe platform behavior.'],
  ['Workers AI and configured providers', 'Supplied evidence and prompts required for generation, translation, classification, speech or retrieval tasks.'],
] as const;

export const TrustCenterPage = () => (
  <div className="bg-white text-navy">
    <SEO
      title="Trust Center"
      description="Current BOA-Story security controls, infrastructure, data handling, service health and procurement disclosures."
    />

    <section className="border-b border-white/15 bg-navy text-white">
      <div className="page-container py-16 md:py-24">
        <div className="max-w-4xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-navy">
            <ShieldCheck size={25} />
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-white/60">Trust Center</p>
          <h1 className="mt-4 font-serif text-[clamp(2.8rem,6vw,5.2rem)] leading-[1.02] text-white">
            Implemented controls and unvarnished gaps.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/75 md:text-xl">
            This page distinguishes controls that exist in the product from certifications, contracts and assurances
            BOA-Story has not yet earned. It is a procurement starting point, not a substitute for due diligence.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="https://alyssa-boa-api.alyssavanklassen.workers.dev/health/deep"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-navy"
            >
              View live deep health <ExternalLink size={16} />
            </a>
            <Link to="/contact?inquiry=Security%20Review" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              Request a security review
            </Link>
          </div>
        </div>
      </div>
    </section>

    <nav aria-label="Trust Center sections" className="sticky top-[4.5rem] z-30 border-b border-border bg-white/95 backdrop-blur lg:top-[4.75rem]">
      <div className="page-container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
        {[
          ['Controls', 'controls'],
          ['Procurement disclosures', 'disclosures'],
          ['Data map', 'data'],
          ['Operations', 'operations'],
        ].map(([label, id]) => (
          <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg border border-border px-4 py-2 text-xs font-bold text-navy hover:border-navy hover:bg-navy hover:text-white">
            {label}
          </a>
        ))}
      </div>
    </nav>

    <section id="controls" className="scroll-mt-40 border-b border-border">
      <div className="page-container grid gap-10 py-14 md:py-20 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Implemented today</p>
          <h2 className="mt-3 font-serif text-4xl text-navy md:text-5xl">Product and operational controls.</h2>
          <p className="mt-5 leading-8 text-navy/70">
            These statements describe repository behavior and deployed health checks. They are not third-party attestations.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {implementedControls.map(control => (
            <li key={control} className="flex gap-4 rounded-2xl border border-border p-5 text-sm leading-7 text-navy/70">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Check size={14} /></span>
              {control}
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section id="disclosures" className="scroll-mt-40 border-b border-border bg-white">
      <div className="page-container py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/60">Procurement disclosures</p>
          <h2 className="mt-3 font-serif text-4xl text-navy md:text-5xl">What an enterprise buyer should not assume.</h2>
          <p className="mt-5 text-lg leading-8 text-navy/70">
            Missing assurances are stated directly so a pilot can be scoped around the buyer's actual risk requirements.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {disclosures.map(item => (
            <article key={item.area} className="rounded-3xl border border-border p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-navy">{item.area}</h3>
                <span className="shrink-0 rounded-full border border-navy/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-navy">
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-navy/70">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="data" className="scroll-mt-40 border-b border-border bg-navy text-white">
      <div className="page-container grid gap-10 py-14 md:py-20 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Data map</p>
          <h2 className="mt-3 font-serif text-4xl text-white md:text-5xl">Where platform data is processed.</h2>
          <p className="mt-5 leading-8 text-white/70">
            The production architecture is Cloudflare-native. Optional external providers receive only the material needed for the configured task.
          </p>
        </div>
        <dl className="divide-y divide-white/15 rounded-3xl border border-white/20">
          {dataMap.map(([name, detail]) => (
            <div key={name} className="grid gap-2 p-5 md:grid-cols-[12rem_1fr] md:p-6">
              <dt className="font-bold text-white">{name}</dt>
              <dd className="text-sm leading-7 text-white/70">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>

    <section id="operations" className="scroll-mt-40">
      <div className="page-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-border p-7 md:p-9">
            <ShieldCheck size={25} />
            <h2 className="mt-5 text-2xl font-bold text-navy">Operational evidence</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-navy/70">
              <li>Lightweight, liveness, readiness and deep-health endpoints are public.</li>
              <li>Worker telemetry persists in D1 and is pruned after seven days.</li>
              <li>Generation, translation and optimization queues have bounded retries.</li>
              <li>R2 is preferred for media; the current Alyssa deployment reports healthy KV media fallback.</li>
              <li>The current deployment reports degraded email delivery because no verified sender is configured.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-navy bg-navy p-7 text-white md:p-9">
            <ShieldAlert size={25} />
            <h2 className="mt-5 text-2xl font-bold text-white">Before sensitive or regulated use</h2>
            <p className="mt-5 text-sm leading-7 text-white/75">
              A buyer should complete a security review, define permitted data, agree retention and deletion requirements,
              establish incident contacts, determine contractual service levels and confirm whether independent testing or
              certification is mandatory. BOA-Story should not receive confidential, regulated or personal datasets until
              those controls are agreed.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link to="/privacy" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy">Privacy policy</Link>
              <Link to="/contact?inquiry=Security%20Review" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Contact for review</Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
);

export default TrustCenterPage;
