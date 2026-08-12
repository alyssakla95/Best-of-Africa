import React from 'react';
import { Link } from 'react-router-dom';
import { KO_FI_URL } from '../constants/beta';
import { useLanguage } from '../context/LanguageContext';
import { JOURNEYS } from '@/lib/navigation';
import { trackJourneySelection } from '@/lib/navigationTelemetry';

const groups = [
  { title: 'Read', links: [['Daily briefing', '/feed'], ['Stories', '/posts'], ['Events', '/events'], ['Newsletter', '/newsletter']] },
  { title: 'Markets', links: [['Market intelligence', '/intelligence'], ['Continental overview', '/dashboards/overview'], ['Country profiles', '/countries'], ['Research reports', '/intelligence/reports']] },
  { title: 'Network', links: [['Specialist network', '/specialists'], ['Knowledge circles', '/specialists/circles'], ['Decision rooms', '/decision-rooms'], ['Circle Launchpad', '/community-transition']] },
  { title: 'Enterprise', links: [['Enterprise overview', '/enterprise'], ['Start a pilot', '/enterprise/apply'], ['Request expertise', '/specialists/requests/new'], ['Client workspace', '/enterprise/access']] },
] as const;

const portugueseGroups = [
  { title: 'Ler', links: [['Síntese diária', '/feed'], ['Histórias', '/posts'], ['Eventos', '/events'], ['Boletim', '/newsletter']] },
  { title: 'Mercados', links: [['Inteligência de mercado', '/intelligence'], ['Panorama continental', '/dashboards/overview'], ['Perfis de países', '/countries'], ['Relatórios de pesquisa', '/intelligence/reports']] },
  { title: 'Rede', links: [['Rede de especialistas', '/specialists'], ['Círculos de conhecimento', '/specialists/circles'], ['Salas de decisão', '/decision-rooms'], ['Lançamento de círculos', '/community-transition']] },
  { title: 'Empresas', links: [['Visão empresarial', '/enterprise'], ['Iniciar um projecto-piloto', '/enterprise/apply'], ['Solicitar conhecimentos especializados', '/specialists/requests/new'], ['Espaço do cliente', '/enterprise/access']] },
] as const;

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const visibleGroups = language === 'pt' ? portugueseGroups : groups;
  return (
    <footer className="mt-24 border-t border-white/15 bg-navy text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.15fr_1.85fr] lg:gap-20">
          <div>
            <Link to="/" className="inline-flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-white font-serif text-xl font-black text-navy">B</span><span className="font-serif text-2xl font-semibold tracking-tight">BOA-Story</span></Link>
            <p className="mt-6 max-w-md font-serif text-3xl leading-tight text-white md:text-4xl">{language === 'pt' ? 'Dados, cobertura e contexto africanos num único lugar.' : 'African evidence, reporting and context in one place.'}</p>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">{language === 'pt' ? 'Cobertura independente, registos nacionais e inteligência de mercado concebidos para tornar compreensíveis acontecimentos complexos sem os reduzir a afirmações sem fundamento.' : 'Independent reporting, country records and market intelligence designed to make complex developments understandable without reducing them to unsupported claims.'}</p>
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-11 items-center rounded-md border border-white/30 px-4 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy">{language === 'pt' ? 'Apoiar a cobertura independente' : 'Support independent reporting'}</a>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-10">
            {visibleGroups.map((group, groupIndex) => (
              <div key={group.title}>
                <h2 className="mb-5 border-b border-white/15 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/55">{group.title}</h2>
                <ul className="space-y-3.5 text-sm text-white/70">
                  {group.links.map(([label, to]) => <li key={to}><Link to={to} onClick={() => trackJourneySelection(JOURNEYS[groupIndex].id, 'footer', to)} className="transition-colors hover:text-white">{label}</Link></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Best of Africa. {language === 'pt' ? 'Todos os direitos reservados.' : 'All rights reserved.'}</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/membership" className="hover:text-white">{language === 'pt' ? 'Adesão' : 'Membership'}</Link>
            <Link to="/library" className="hover:text-white">{language === 'pt' ? 'Pesquisa guardada' : 'Saved research'}</Link>
            <Link to="/about" className="hover:text-white">{language === 'pt' ? 'Sobre' : 'About'}</Link>
            <Link to="/trust" className="hover:text-white">{language === 'pt' ? 'Confiança' : 'Trust'}</Link>
            <Link to="/contact" className="hover:text-white">{language === 'pt' ? 'Contacto' : 'Contact'}</Link>
            <Link to="/privacy" className="hover:text-white">{language === 'pt' ? 'Privacidade' : 'Privacy'}</Link>
            <Link to="/terms" className="hover:text-white">{language === 'pt' ? 'Termos' : 'Terms'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
