import React from 'react';
import { Link } from 'react-router-dom';
import { KO_FI_URL } from '../constants/beta';

const groups = [
  { title: 'Read', links: [['Stories', '/posts'], ['Daily Briefing', '/feed'], ['Countries', '/countries'], ['Gallery', '/gallery']] },
  { title: 'Intelligence', links: [['Market Intelligence', '/intelligence'], ['Continental Overview', '/dashboards/overview'], ['Decision Workspace', '/library']] },
  { title: 'Enterprise', links: [['Market-Entry Pilot', '/enterprise'], ['Apply for a Pilot', '/enterprise/apply'], ['Trust Center', '/trust'], ['Consultation', '/request-consultation'], ['Events', '/events'], ['Business Travel', '/travel'], ['Contact', '/contact']] },
  { title: 'Account', links: [['Membership', '/membership'], ['Newsletter', '/newsletter'], ['Member Access', '/member-access'], ['Sign In', '/login']] },
] as const;

export const Footer: React.FC = () => (
  <footer className="mt-24 border-t border-white/15 bg-navy text-white">
    <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.15fr_1.85fr] lg:gap-20">
        <div>
          <Link to="/" className="inline-flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-white font-serif text-xl font-black text-navy">B</span><span className="font-serif text-2xl font-semibold tracking-tight">BOA-Story</span></Link>
          <p className="mt-6 max-w-md font-serif text-3xl leading-tight text-white md:text-4xl">African evidence, reporting and context in one place.</p>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">Independent reporting, country records and market intelligence designed to make complex developments understandable without reducing them to unsupported claims.</p>
          <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-11 items-center rounded-md border border-white/30 px-4 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy">Support independent reporting</a>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-10">
          {groups.map(group => (
            <div key={group.title}>
              <h2 className="mb-5 border-b border-white/15 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/55">{group.title}</h2>
              <ul className="space-y-3.5 text-sm text-white/70">
                {group.links.map(([label, to]) => <li key={to}><Link to={to} className="transition-colors hover:text-white">{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-5 pt-7 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Best of Africa. All rights reserved.</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/about" className="hover:text-white">About</Link><Link to="/enterprise" className="hover:text-white">Enterprise</Link><Link to="/trust" className="hover:text-white">Trust</Link><Link to="/contact" className="hover:text-white">Contact</Link><Link to="/privacy" className="hover:text-white">Privacy</Link><Link to="/terms" className="hover:text-white">Terms</Link><Link to="/settings" className="hover:text-white">Settings</Link>
        </div>
      </div>
    </div>
  </footer>
);
