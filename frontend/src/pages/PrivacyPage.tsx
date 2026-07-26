import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const SECTIONS = [
    { id: 'data-collection', title: '1. Data Collection' },
    { id: 'use-of-information', title: '2. Use of Information' },
    { id: 'data-protection', title: '3. Data Protection' },
    { id: 'retention', title: '4. Retention' },
    { id: 'rights', title: '5. Your Rights' },
    { id: 'contact', title: '6. Contact' },
];

export const PrivacyPage: React.FC = () => {
    return (
        <>
            <SEO title="Privacy Policy" description="How BOA-Story collects, uses, retains, and protects reader and account information." />
            <div className="container py-14 md:py-20 max-w-3xl">
                <header className="app-hero mb-10 rounded-lg border-b border-border p-6 sm:p-8">
                    <h1 className="mb-4 text-4xl font-serif font-semibold tracking-tight text-ink md:text-5xl">Privacy Policy</h1>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/65">Last Updated: July 2026</p>
                </header>

                {/* Table of contents */}
                <nav aria-label="On this page" className="mb-12 rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-blue">On this page</h2>
                    <ul className="space-y-2">
                        {SECTIONS.map(s => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-navy underline decoration-navy/25 underline-offset-4 transition-colors text-sm font-medium">{s.title}</a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="max-w-none text-ink-soft [&_p]:leading-[1.8] [&_p]:text-base">
                    <section id="data-collection" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">1. Data Collection</h2>
                        <p>We collect information you provide directly, including account details, briefing preferences, newsletter subscriptions, bookmarks, contact messages and pilot applications.</p>
                        <p className="mt-4">For first-party audience measurement, each recorded reader event includes the page or content identifier, event time, reading or playback progress when applicable, a hashed session identifier, the connecting IP address and a one-way SHA-256 fingerprint of the normalized browser user-agent. The raw user-agent string is not stored in the engagement table.</p>
                    </section>

                    <section id="use-of-information" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">2. Use of Information</h2>
                        <p>We use your data to:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Provide personalized market intelligence.</li>
                            <li>Analyze platform usage trends.</li>
                            <li>Measure briefing use, return visits, high-progress reading, audio completion and saved content.</li>
                            <li>Protect the service, investigate abuse and distinguish repeated activity.</li>
                            <li>Communicate important updates.</li>
                        </ul>
                    </section>

                    <section id="data-protection" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">3. Data Protection</h2>
                        <p>We use technical and organizational safeguards intended to reduce unauthorized access, loss, or misuse. No online service can guarantee absolute security. We do not sell personal information.</p>
                        <p className="mt-4">Raw audience events and their IP addresses and user-agent fingerprints are available only through authenticated operator reporting. Public pages do not expose individual event records.</p>
                    </section>

                    <section id="retention" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">4. Retention</h2>
                        <p>Reader engagement events, including stored IP addresses and user-agent fingerprints, are retained for no more than 90 days. Account, subscription, bookmark, contact and commercial records are retained for as long as needed to provide the service, meet legal obligations or resolve a request.</p>
                    </section>

                    <section id="rights" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">5. Your Rights</h2>
                        <p>You may ask about personal information associated with you, request correction or deletion where applicable, or object to particular processing. Requests are assessed under the privacy law that applies to the service and requester, including PIPEDA for eligible Canadian requests and other applicable regional privacy rules.</p>
                    </section>

                    <section id="contact" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">6. Contact</h2>
                        <p>For privacy concerns, use the <Link to="/contact" className="font-bold text-navy underline underline-offset-4">secure contact form</Link> and identify the request as a privacy matter.</p>
                    </section>
                </div>

                <div className="mt-12 border-t border-border pt-6 text-sm text-ink-blue">
                    See also: <Link to="/terms" className="text-navy underline underline-offset-4 font-medium">Terms of Service</Link>
                    {' · '}
                    <Link to="/contact" className="text-navy underline underline-offset-4 font-medium">Contact Us</Link>
                </div>
            </div>
        </>
    );
};
