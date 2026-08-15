import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, List, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

type PageSection = { id: string; label: string };

export function ScrollToTopButton() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      setVisible(window.scrollY > Math.min(260, window.innerHeight * 0.3));
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? Math.min(100, Math.max(0, (window.scrollY / available) * 100)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const resetFrame = window.requestAnimationFrame(() => {
      setVisible(false);
      setOpen(false);
      setActiveSection(null);
    });

    const collect = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>('main h2'))
        .filter(heading => heading.textContent?.trim() && heading.offsetParent !== null)
        .slice(0, 14);
      const routeKey = pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
      const seen = new Set<string>();
      const next = headings.map((heading, index) => {
        const idIsDuplicated = Boolean(heading.id) && document.querySelectorAll(`#${CSS.escape(heading.id)}`).length > 1;
        if (!heading.id || seen.has(heading.id) || idIsDuplicated) {
          let candidate = `page-section-${routeKey}-${index + 1}`;
          let suffix = 1;
          while (document.getElementById(candidate) || seen.has(candidate)) candidate = `page-section-${routeKey}-${index + 1}-${++suffix}`;
          heading.id = candidate;
        }
        seen.add(heading.id);
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        return { id: heading.id, label: heading.textContent!.trim().replace(/\s+/g, ' ') };
      });
      setSections(next.length >= 3 ? next : []);
    };

    const schedule = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(collect, 120);
    };
    schedule();
    const main = document.querySelector('main');
    const observer = new MutationObserver(schedule);
    if (main) observer.observe(main, { childList: true, characterData: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(resetFrame);
      observer.disconnect();
      window.clearTimeout(timerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    if (!sections.length) return;
    let frame = 0;
    const updateActive = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const headerOffset = (document.querySelector('.site-header')?.getBoundingClientRect().height || 64) + 36;
        let current = sections[0]?.id || null;
        for (const section of sections) {
          const element = document.getElementById(section.id);
          if (element && element.getBoundingClientRect().top <= headerOffset) current = section.id;
          else if (element) break;
        }
        setActiveSection(current);
      });
    };
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, [sections]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);

  return (
    <>
      {open && sections.length > 0 && (
        <nav id="page-section-menu" aria-label={t('nav.sections', 'Sections on this page')} className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-40 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-navy/15 bg-white shadow-[0_24px_60px_-24px_rgba(15,31,61,0.55)] sm:left-6 sm:w-[min(23rem,calc(100vw-3rem))] lg:bottom-[5.25rem]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/60">{t('nav.on_this_page', 'On this page')}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-navy/50 hover:bg-navy/5 hover:text-navy" aria-label={t('nav.close_sections', 'Close section menu')}><X size={15} /></button>
          </div>
          <div className="max-h-[min(55dvh,28rem)] overflow-y-auto p-2">
            {sections.map((section, index) => {
              const active = activeSection === section.id;
              return (
              <button
                type="button"
                key={section.id}
                onClick={() => {
                  const element = document.getElementById(section.id);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.setTimeout(() => element?.focus({ preventScroll: true }), 450);
                  setOpen(false);
                }}
                aria-current={active ? 'location' : undefined}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm leading-5 transition-colors ${active ? 'bg-navy text-white' : 'text-navy/75 hover:bg-navy/5 hover:text-navy'}`}
              >
                <span className={`mt-0.5 w-5 shrink-0 text-[10px] font-bold tabular-nums ${active ? 'text-white/65' : 'text-navy/35'}`}>{String(index + 1).padStart(2, '0')}</span>
                <span className="flex-1">{section.label}</span>
                {active && <Check size={15} className="mt-0.5 shrink-0" aria-hidden="true" />}
              </button>
            )})}
          </div>
        </nav>
      )}

      <div className="fixed bottom-[calc(4.65rem+env(safe-area-inset-bottom))] left-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 sm:left-6 sm:max-w-none lg:bottom-6">
        {sections.length > 0 && visible && (
          <button
            type="button"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="page-section-menu"
            aria-label={t('nav.sections', 'Sections on this page')}
            className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-navy/15 bg-white p-0 text-xs font-bold text-navy shadow-[0_12px_35px_-16px_rgba(15,31,61,0.55)] hover:border-navy/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy sm:w-auto sm:max-w-[17rem] sm:justify-start sm:gap-2 sm:px-3.5"
          >
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-navy/10" aria-hidden="true"><span className="block h-full bg-navy" style={{ width: `${progress}%` }} /></span>
            <List size={16} aria-hidden="true" />
            <span className="hidden max-w-[13rem] truncate sm:inline">{sections.find(section => section.id === activeSection)?.label || t('nav.on_this_page', 'On this page')}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('nav.return_top', 'Return to the main menu and top of page')}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-navy/15 bg-white px-3.5 text-xs font-bold uppercase tracking-[0.1em] text-navy shadow-[0_12px_35px_-16px_rgba(15,31,61,0.55)] transition-all duration-200 hover:border-navy/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        >
          <ArrowUp size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t('nav.menu_top', 'Menu & top')}</span>
        </button>
      </div>
    </>
  );
}
