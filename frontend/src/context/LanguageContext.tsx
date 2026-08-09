/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES as CONTENT_LANGUAGES } from '../types';
import { TRANSLATIONS } from '../i18n/dict';
import { applyPortuguese1945Orthography } from '../i18n/portuguese-orthography';
import { useQueryClient } from '@tanstack/react-query';
// Article and interface language are one reader preference. Selecting a locale
// changes the application chrome and is also passed to article queries so the
// stored article translation is served when available.
export const SUPPORTED_LANGUAGES = CONTENT_LANGUAGES;

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    dir: 'ltr' | 'rtl';
    t: (key: string, fallback?: string) => string; // Simple translation helper
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    // 1. Initialize from URL or LocalStorage or Default
    const [language, setLanguageState] = useState<LanguageCode>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('boa_lang') as LanguageCode;
            if (stored && SUPPORTED_LANGUAGES.find(l => l.code === stored)) {
                return stored;
            }
        }
        return 'en';
    });

    const setLanguage = (lang: LanguageCode) => {
        const supported = SUPPORTED_LANGUAGES.some(language => language.code === lang) ? lang : 'en';
        setLanguageState(supported);
        if (typeof window !== 'undefined') {
            localStorage.setItem('boa_lang', supported);
            // Update HTML dir attribute for global CSS support
            const dir = SUPPORTED_LANGUAGES.find(l => l.code === supported)?.dir || 'ltr';
            document.documentElement.dir = dir;
            document.documentElement.lang = supported === 'pt' ? 'pt-PT' : supported;
            if (supported === 'pt') document.documentElement.dataset.orthography = '1945';
            else delete document.documentElement.dataset.orthography;
            // Reader endpoints derive their locale from this preference. Mark
            // active data stale so lists, reports and dashboards refresh into
            // the newly requested language instead of retaining an English
            // React Query snapshot under an unchanged key.
            void queryClient.invalidateQueries({ refetchType: 'active' });
        }
    };

    const dir = SUPPORTED_LANGUAGES.find((l: { code: string }) => l.code === language)?.dir || 'ltr';

    // Apply text direction + lang on mount and whenever the language changes, so a
    // persisted RTL choice (e.g. Arabic) is honoured on reload, not only on switch.
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.dir = dir;
            document.documentElement.lang = language === 'pt' ? 'pt-PT' : language;
            if (language === 'pt') document.documentElement.dataset.orthography = '1945';
            else delete document.documentElement.dataset.orthography;
        }
    }, [language, dir]);

    // UI Translation Dictionary
    const translations: Record<LanguageCode, Record<string, string>> = {
        en: {
            "nav.home": "Home",
            "nav.feed": "Daily Stories",
            "nav.sectors": "Topics",
            "nav.countries": "Countries",
            "nav.dashboards": "Coverage Map",
            "nav.reports": "Reports",
            "nav.summits": "Summits",
            "nav.concierge": "Contact",
            "nav.travel": "Travel",
            "nav.search": "Search",
            "nav.settings": "Settings",
            "intel.stream": "Story Feed",
            "intel.tools": "Reading Tools",
            "intel.corporate": "Services",
            "intel.workspace": "Your Space",
            "analyst.console": "Console",
            "intel.new_articles": "NEW",
            "intel.loading_market": "Loading stories...",
            "intel.processing": "Loading story feed...",
            "home.badge": "BOA-Story, Beyond the Headlines",
            "home.cta_primary": "Read the stories",
            "home.cta_secondary": "Browse Countries",
            "home.top_intel": "Top Stories",
            "home.top_intel_sub": "Real, grounded reporting from across the continent, beyond charity ads and disaster headlines.",
            "home.read_brief": "Read Story",
            "home.partners": "Community",
            "home.partners_sub": "People making this project possible.",
            "home.partner_with_us": "Support on Ko-fi",
            "home.latest_analysis": "Latest Reporting",
            "home.read_analysis": "Read Story",
            "article.context": "Context",
            "article.contents": "Contents",
            "article.sentiment_analysis": "Editorial Notes",
            "article.market_sentiment": "Tone",
            "article.gdp_growth": "GDP Growth",
            "article.stability": "Stability",
            "article.view_country": "More from this country",
            "article.market_outlook": "Country Context",
            "article.view_sector": "More on this topic",
            "article.need_data": "Want to go deeper?",
            "article.request_briefing": "Get in touch",
            "article.related": "Related Stories",
            "intel.situation_room": "Overview",
            "intel.economic_data": "Economic Context",
            "intel.sector_matrix": "Topics",
            "intel.intel_stream": "Story Feed",
            "intel.history_baobab": "History & Culture",
            "intel.strategic_feed": "Stories",
            "intel.intel_archive": "Story Archive",
            "intel.stability_index": "Stability",
            "intel.top_sector": "Top Topic",
            "intel.emerging_narratives": "Emerging Stories",
            "intel.market_considerations": "Context",
            "stats.gdp_usd": "GDP (USD)",
            "stats.population": "Population",
            "stats.fdi": "Foreign Investment",
            "intel.strategic_relations": "Diplomatic Relations",
            "intel.diplomacy_score": "Diplomacy",
            "intel.volatility_risk": "Risk Level",
            "intel.sector_performance": "Topic Coverage",
            "intel.strategic_matrix": "Coverage Overview",
            "lens.investor": "Economic Lens",
            "lens.government": "Policy Lens",
            "lens.explorer": "Cultural Lens"
        },
        pt: {
            "nav.home": "Início",
            "nav.feed": "Resumo Diário",
            "nav.sectors": "Setores",
            "nav.countries": "Países",
            "nav.dashboards": "Dashboards de Risco",
            "nav.reports": "Relatórios",
            "nav.summits": "Cimeiras",
            "nav.concierge": "Concierge",
            "nav.travel": "Viagens Seguras",
            "nav.search": "Pesquisar",
            "nav.settings": "Configurações",
            "intel.stream": "Fluxo de Inteligência",
            "intel.tools": "Ferramentas de Análise",
            "intel.corporate": "Serviços Corporativos",
            "intel.workspace": "Área de Trabalho",
            "analyst.console": "Consola de Analista",
            "intel.new_articles": "NOVO",
            "intel.loading_market": "Carregando dados de mercado...",
            "intel.processing": "Processando Fluxo de Inteligência...",
            "home.badge": "Inteligência Pan-Africana Premium",
            "home.cta_primary": "Explorar Inteligência v2",
            "home.cta_secondary": "Ver Países",
            "home.top_intel": "Principais Informações",
            "home.top_intel_sub": "Resumos de inteligência estratégica de alta prioridade, para fundadores e investidores.",
            "home.read_brief": "Ler Resumo Completo de Inteligência",
            "home.partners": "Parceiros Estratégicos",
            "home.partners_sub": "Organizações globais alinhadas com o crescimento africano.",
            "home.partner_with_us": "Seja nosso parceiro",
            "home.latest_analysis": "Última Análise Setorial",
            "home.read_analysis": "Ler Análise",
            "article.context": "Contexto Operacional",
            "article.contents": "Conteúdo",
            "article.sentiment_analysis": "Análise de Sentimento do Analista",
            "article.market_sentiment": "Sentimento de Mercado",
            "article.gdp_growth": "Crescimento do PIB",
            "article.stability": "Estabilidade",
            "article.view_country": "Ver Painel do País",
            "article.market_outlook": "Perspetiva de Mercado",
            "article.view_sector": "Ver Análise Setorial",
            "article.need_data": "Precisa de dados mais profundos?",
            "article.request_briefing": "Solicitar Briefing",
            "article.related": "Inteligência Relacionada",
            "intel.situation_room": "Sala de Situação",
            "intel.economic_data": "Dados Económicos",
            "intel.sector_matrix": "Matriz Setorial",
            "intel.intel_stream": "Fluxo de Inteligência",
            "intel.history_baobab": "História e Baobá",
            "intel.strategic_feed": "Feed Estratégico",
            "intel.intel_archive": "Arquivo de Inteligência",
            "intel.stability_index": "Índice de Estabilidade",
            "intel.top_sector": "Setor Dominante",
            "intel.emerging_narratives": "Narrativas Emergentes",
            "intel.market_considerations": "Considerações de Mercado",
            "stats.gdp_usd": "PIB (USD)",
            "stats.population": "População",
            "stats.fdi": "Investimento Direto Estrangeiro",
            "intel.strategic_relations": "Relações Estratégicas",
            "intel.diplomacy_score": "Pontuação Diplomática",
            "intel.volatility_risk": "Risco de Volatilidade",
            "intel.sector_performance": "Desempenho Setorial",
            "intel.strategic_matrix": "Matriz de Oportunidades Estratégicas",
            "lens.investor": "Análise de Valor",
            "lens.government": "Análise de Políticas",
            "lens.explorer": "Análise Exploratória"
        },
        fr: {
            "nav.home": "Accueil",
            "nav.feed": "Briefing Quotidien",
            "nav.sectors": "Secteurs",
            "nav.countries": "Pays",
            "nav.dashboards": "Tableaux de Bord",
            "nav.reports": "Rapports",
            "nav.summits": "Sommets",
            "nav.concierge": "Concierge",
            "nav.travel": "Voyages Sécurisés",
            "nav.search": "Rechercher",
            "nav.settings": "Paramètres",
            "intel.stream": "Flux d'Intelligence",
            "intel.tools": "Outils d'Analyse",
            "intel.corporate": "Services aux Entreprises",
            "intel.workspace": "Espace de Travail",
            "analyst.console": "Console Analyste",
            "intel.new_articles": "NOUVEAU",
            "intel.loading_market": "Chargement des données...",
            "intel.processing": "Traitement du flux d'intelligence...",
            "home.badge": "Intelligence Pan-Africaine Premium",
            "home.cta_primary": "Explorer Intelligence v2",
            "home.cta_secondary": "Voir les Pays",
            "home.top_intel": "Top Intelligence",
            "home.top_intel_sub": "Briefings stratégiques de haute priorité, pour les fondateurs et investisseurs.",
            "home.read_brief": "Lire le Briefing Complet",
            "home.partners": "Partenaires Stratégiques",
            "home.partners_sub": "Organisations mondiales alignées sur la croissance africaine.",
            "home.partner_with_us": "Devenir partenaire",
            "home.latest_analysis": "Dernière Analyse Sectorielle",
            "home.read_analysis": "Lire l'Analyse"
        },
        de: {
            "nav.home": "Startseite",
            "nav.feed": "Täglicher Bericht",
            "nav.sectors": "Sektoren",
            "nav.countries": "Länder",
            "nav.dashboards": "Risiko-Dashboards",
            "nav.reports": "Berichte",
            "nav.summits": "Gipfeltreffen",
            "nav.concierge": "Concierge",
            "nav.travel": "Sicheres Reisen",
            "nav.search": "Suche",
            "nav.settings": "Einstellungen",
            "intel.stream": "Geheimdienst-Stream",
            "intel.tools": "Analysewerkzeuge",
            "intel.corporate": "Firmendienste",
            "intel.workspace": "Arbeitsbereich",
            "analyst.console": "Analystenkonsole",
            "intel.new_articles": "NEU",
            "intel.loading_market": "Marktdaten werden geladen...",
            "intel.processing": "Geheimdienst-Stream wird verarbeitet...",
            "home.badge": "Premium Pan-Afrikanische Intelligenz",
            "home.cta_primary": "Intelligenz v2 erkunden",
            "home.cta_secondary": "Länder anzeigen",
            "home.top_intel": "Top-Informationen",
            "home.top_intel_sub": "Strategische Analysen mit hoher Priorität, kuratiert für Gründer und Investoren.",
            "home.read_brief": "Vollständigen Bericht lesen",
            "home.partners": "Strategische Partner",
            "home.partners_sub": "Globale Organisationen, ausgerichtet auf afrikanisches Wachstum.",
            "home.partner_with_us": "Werden Sie Partner",
            "home.latest_analysis": "Aktuelle Sektoranalyse",
            "home.read_analysis": "Analyse lesen"
        },
        zh: {
            "nav.home": "首页",
            "nav.feed": "每日简报",
            "nav.sectors": "部门",
            "nav.countries": "国家",
            "nav.dashboards": "风险仪表板",
            "nav.reports": "报告",
            "nav.summits": "峰会",
            "nav.concierge": "礼宾服务",
            "nav.travel": "安全旅行",
            "nav.search": "搜索",
            "nav.settings": "设置",
            "intel.stream": "情报流",
            "intel.tools": "分析工具",
            "intel.corporate": "企业服务",
            "intel.workspace": "工作区",
            "analyst.console": "分析师控制台",
            "intel.new_articles": "新",
            "intel.loading_market": "正在加载市场数据...",
            "intel.processing": "正在处理情报流...",
            "home.badge": "优质泛非情报",
            "home.cta_primary": "探索情报 v2",
            "home.cta_secondary": "查看国家",
            "home.top_intel": "顶级情报",
            "home.top_intel_sub": "高优先级战略情报简报，专为创始人和投资者精心策划。",
            "home.read_brief": "阅读完整情报简报",
            "home.partners": "战略合作伙伴",
            "home.partners_sub": "与非洲增长保持一致的全球组织。",
            "home.partner_with_us": "与我们合作",
            "home.latest_analysis": "最新行业分析",
            "home.read_analysis": "阅读分析"
        },
        ar: {
            "nav.home": "الرئيسية",
            "nav.feed": "الإحاطة اليومية",
            "nav.sectors": "القطاعات",
            "nav.countries": "الدول",
            "nav.dashboards": "لوحات المخاطر",
            "nav.reports": "التقارير",
            "nav.summits": "القمم",
            "nav.concierge": "الكونسيرج",
            "nav.travel": "السفر الآمن",
            "nav.search": "بحث",
            "nav.settings": "الإعدادات",
            "intel.stream": "تدفق المعلومات",
            "intel.tools": "أدوات التحليل",
            "intel.corporate": "خدمات الشركات",
            "intel.workspace": "مساحة العمل",
            "analyst.console": "لوحة المحلل",
            "intel.new_articles": "جديد",
            "intel.loading_market": "جاري تحميل بيانات السوق...",
            "intel.processing": "جاري معالجة تدفق المعلومات...",
            "home.badge": "معلومات متميزة لعموم أفريقيا",
            "home.cta_primary": "استكشاف المعلومات v2",
            "home.cta_secondary": "عرض الدول",
            "home.top_intel": "أهم المعلومات",
            "home.top_intel_sub": "إيجازات استراتيجية عالية الأولوية، منسقة للمؤسسين والمستثمرين.",
            "home.read_brief": "اقرأ الإيجاز الكامل",
            "home.partners": "الشركاء الاستراتيجيون",
            "home.partners_sub": "منظمات عالمية تتماشى مع النمو الأفريقي.",
            "home.partner_with_us": "شريك معنا",
            "home.latest_analysis": "أحدث تحليل للقطاع",
            "home.read_analysis": "اقرأ التحليل"
        },
        hi: {
            "nav.home": "होम",
            "nav.feed": "दैनिक ब्रीफिंग",
            "nav.sectors": "क्षेत्र",
            "nav.countries": "देश",
            "nav.dashboards": "जोخिम डैशबोर्ड",
            "nav.reports": "रिपोर्ट",
            "nav.summits": "शिखर सम्मेलन",
            "nav.concierge": "कंसीयर्ज",
            "nav.travel": "सुरक्षित यात्रा",
            "nav.search": "खोजें",
            "nav.settings": "सेटिंग्स",
            "intel.stream": "इंटेलिजेंस स्ट्रीम",
            "intel.tools": "विश्लेषण उपकरण",
            "intel.corporate": "कॉर्पोरेट सेवाएं",
            "intel.workspace": "कार्यक्षेत्र",
            "analyst.console": "विश्लेषक सांत्वना",
            "intel.new_articles": "नया",
            "intel.loading_market": "बाज़ार डेटा लोड हो रहा है...",
            "intel.processing": "इंटेलिजेंस स्ट्रीम संसाधित की जा रही है...",
            "home.badge": "प्रीमियम पैन-अफ्रीकी इंटेलिजेंस",
            "home.cta_primary": "इंटेलिजेंस v2 एक्सप्लोर करें",
            "home.cta_secondary": "देश देखें",
            "home.top_intel": "शीर्ष इंटेलिजेंस",
            "home.top_intel_sub": "उच्च प्राथमिकता वाली रणनीतिक खुफिया जानकारी, संस्थापकों और निवेशकों के लिए क्यूरेट की गई।",
            "home.read_brief": "पूर्ण इंटेलिजेंस ब्रीफ पढ़ें",
            "home.partners": "रणनीतिक साझेदार",
            "home.partners_sub": "अफ्रीकी विकास के साथ जुड़े वैश्विक संगठन।",
            "home.partner_with_us": "हमारे साथ भागीदार बनें",
            "home.latest_analysis": "नवीनतम क्षेत्र विश्लेषण",
            "home.read_analysis": "विश्लेषण पढ़ें"
        }
    };

    // Translation helper. Resolution order: shared chrome dict (current lang) →
    // legacy inline dict (current lang) → shared chrome dict (English) → fallback → key.
    const t = (key: string, fallback?: string) => {
        const value = (
            TRANSLATIONS[language]?.[key] ??
            translations[language]?.[key] ??
            TRANSLATIONS.en?.[key] ??
            translations.en?.[key] ??
            fallback ??
            key
        );
        return language === 'pt' ? applyPortuguese1945Orthography(value) : value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
