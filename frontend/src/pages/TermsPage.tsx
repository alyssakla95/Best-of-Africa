import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const SECTIONS = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'ip', title: '2. Intellectual Property' },
    { id: 'disclaimer', title: '3. Disclaimer' },
    { id: 'marketplace', title: '4. Specialist Marketplace' },
    { id: 'prohibited', title: '5. Prohibited Services' },
    { id: 'termination', title: '6. Termination' },
];

export const TermsPage: React.FC = () => {
    return (
        <>
            <SEO title="Terms of Service" description="The terms governing use of the Best of Africa platform and its content." />
            <div className="container py-14 md:py-20 max-w-3xl">
                <header className="app-hero mb-10 rounded-lg border-b border-border p-6 sm:p-8">
                    <h1 className="mb-4 text-4xl font-serif font-semibold tracking-tight text-ink md:text-5xl">Terms of Service</h1>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Last Updated: August 2026</p>
                </header>

                {/* Table of contents */}
                <nav aria-label="On this page" className="mb-12 rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-blue">On this page</h2>
                    <ul className="space-y-2">
                        {SECTIONS.map(s => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-accent hover:text-gold-italic transition-colors text-sm font-medium">{s.title}</a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="max-w-none text-ink-soft [&_p]:leading-[1.8] [&_p]:text-base">
                    <section id="acceptance" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">1. Acceptance of Terms</h2>
                        <p>By accessing the Best of Africa platform, you agree to these terms. Usage of premium intelligence requires a valid subscription.</p>
                    </section>

                    <section id="ip" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">2. Intellectual Property</h2>
                        <p>All reports, analysis, and content are the property of Best of Africa. Redistribution without license is prohibited.</p>
                    </section>

                    <section id="disclaimer" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">3. Disclaimer</h2>
                        <p>Market intelligence and specialist profiles are provided for informational purposes only and do not constitute financial, legal, tax, medical, regulatory or investment advice. Marketplace screening controls access; it is not an endorsement, warranty of credentials or guarantee of results. Clients remain responsible for due diligence and independent professional advice.</p>
                    </section>

                    <section id="marketplace" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">4. Specialist Marketplace</h2>
                        <p>The public interest registry is not an application, account, endorsement, admission decision or promise of work. BOA-Story may use registry information to identify expertise relevant to emerging Enterprise needs. Only selected specialists receive a separate, single-use invitation to apply, and every invited application remains subject to screening.</p>
                        <p className="mt-4">Founding specialists may receive free, waived listing access while BOA-Story validates repeatable Enterprise demand. A waiver does not create an entitlement to opportunities and payment never purchases verification standing. If a later recurring Stripe listing arrangement applies, its fee is for platform listing access only.</p>
                        <p className="mt-4">BOA-Story is not a party to a later engagement and does not collect percentage commissions or engagement fees, hold client funds, pay specialists, operate milestones, provide marketplace messaging, issue refunds for specialist work, decide disputes or host reviews in this MVP.</p>
                        <p className="mt-4">Specialists control whether to submit a proposal. Indicative fees and timelines are non-binding until the client and specialist enter their own separate agreement. Listing visibility requires continuing approval plus a current BOA listing waiver or active subscription and may be suspended when either basis expires.</p>
                    </section>

                    <section id="prohibited" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">5. Prohibited Services</h2>
                        <p>Users may not offer or request unlawful, deceptive, discriminatory, sanctioned, exploitative or unlicensed regulated services; evade anti-corruption, export, immigration, employment, privacy or professional rules; solicit confidential government or competitor information; or submit identity documents, financial account data, health data or other sensitive material through marketplace forms.</p>
                    </section>

                    <section id="termination" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">6. Termination</h2>
                        <p>We reserve the right to suspend or terminate access, screening approval, Enterprise request privileges or public listing for violation of these terms, unresolved conflicts, inaccurate representations, billing status or platform risk.</p>
                    </section>
                </div>

                <div className="mt-12 border-t border-border pt-6 text-sm text-ink-blue">
                    See also: <Link to="/privacy" className="text-accent hover:text-gold-italic font-medium">Privacy Policy</Link>
                    {' · '}
                    <Link to="/contact" className="text-accent hover:text-gold-italic font-medium">Contact Us</Link>
                </div>
            </div>
        </>
    );
};
