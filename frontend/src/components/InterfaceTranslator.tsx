import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../i18n/dict';
import {
  applyPortuguese1945Orthography,
  PORTUGUESE_INTERFACE_PHRASES,
  translatePortugueseInterfaceText,
} from '../i18n/pt-PT-1945';
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const cache = new Map<string, string>();
const SKIP = 'script,style,code,pre,textarea,[contenteditable="true"],[data-no-translate]';
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'];
const ENGLISH_TEXT = /\b(?:the|and|for|with|from|your|this|that|what|how|which|use|source|market|country|countries|read|view|loading|available|official|report|story|stories|member|search|save|open|evidence|performance|page|access|submit|register|settings|privacy|terms|contact|business|investment|trade|updated|current|failed|error|next|previous|learn|explore|support|apply|select|required|optional|prepared|change|higher|lower|growth|coverage|account|service|definition|value|unit|comparison|timing|boundary|section|observation|projection|freshness|review|reporting)\b/i;
const containsEnglishText = (value: string) => ENGLISH_TEXT.test(value.replace(/BOA-Story/g, ''));
const PORTUGUESE_OUTPUTS = new Set([
  ...Object.values(TRANSLATIONS.pt || {}),
  ...Object.values(PORTUGUESE_INTERFACE_PHRASES),
].map(value => applyPortuguese1945Orthography(value)));
const isPortugueseText = (value: string) => {
  if (/^BOA-Story(?:\s*\|\s*BOA-Story)?$/.test(value)) return true;
  if (PORTUGUESE_OUTPUTS.has(value)) return true;
  const words = value.match(/\b(?:a|ao|aos|as|com|da|das|de|do|dos|em|entre|esta|este|num|numa|não|o|os|ou|para|pela|pelas|pelo|pelos|por|que|sem|uma|um)\b/gi) || [];
  return words.length >= 2 && /[ãõçáéíóúâêôà]|\b(?:actual|actividade|cobertura|dados|país|países|projecto|sector|utilize)\b/i.test(value);
};

export function InterfaceTranslator() {
    const { language, t } = useLanguage();
    const location = useLocation();
    const [status, setStatus] = useState<'source' | 'translating' | 'translated' | 'partial'>('source');

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    // Resolve interface strings exclusively from maintained, reviewable source
    // catalogues. Reader-facing application chrome is never generated at run time.
    for (const [key, english] of Object.entries(TRANSLATIONS.en || {})) {
      const translated = TRANSLATIONS[language]?.[key];
      if (translated) cache.set(`${language}:${english}`, translated);
    }
    if (language === 'pt') {
      for (const [english, portuguese] of Object.entries(PORTUGUESE_INTERFACE_PHRASES)) {
        cache.set(`pt:${english}`, applyPortuguese1945Orthography(portuguese));
      }
    }

    const restore = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        const original = originalText.get(text);
        // Skip no-op writes: setting characterData re-triggers the observer.
        if (original !== undefined && text.data !== original) text.data = original;
      }
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(element => {
        const originals = originalAttributes.get(element);
        originals?.forEach((value, name) => {
          if (element.getAttribute(name) !== value) element.setAttribute(name, value);
        });
      });
    };

    // English is the source language: there is nothing to translate and any
    // earlier translation was already restored by the previous effect's
    // cleanup. Mounting the observer here only re-walks the whole DOM on
    // every mutation, so for English this effect does nothing at all.
    if (language === 'en') {
      document.documentElement.dataset.translationState = 'source';
      return () => { delete document.documentElement.dataset.translationState; };
    }

    const collect = () => {
      const items: Array<{ value: string; apply: (translated: string) => void }> = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          const value = node.textContent?.trim() || '';
          const sourceLanguage = parent?.closest<HTMLElement>('[data-source-language]')?.dataset.sourceLanguage;
          if (!parent || parent.closest(SKIP) || sourceLanguage === language || !value || !/[A-Za-z]/.test(value)) return NodeFilter.FILTER_REJECT;
          if (language === 'pt' && isPortugueseText(value) && !containsEnglishText(value)
            && applyPortuguese1945Orthography(value) === value) return NodeFilter.FILTER_REJECT;
          if (language === 'pt' && !containsEnglishText(value) && !translatePortugueseInterfaceText(value)
            && applyPortuguese1945Orthography(value) === value) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        if (!originalText.has(text)) originalText.set(text, text.data);
        const value = originalText.get(text)!;
        items.push({ value: value.trim(), apply: translated => {
          // Skip no-op writes: setting characterData re-triggers the observer.
          const next = value.replace(value.trim(), translated);
          if (text.data !== next) text.data = next;
        } });
      }
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(element => {
        if (element.closest(SKIP)) return;
        const sourceLanguage = element.closest<HTMLElement>('[data-source-language]')?.dataset.sourceLanguage;
        if (sourceLanguage === language) return;
        let originals = originalAttributes.get(element);
        if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
        for (const name of TRANSLATABLE_ATTRIBUTES) {
          const current = element.getAttribute(name);
          if (!current || !/[A-Za-z]/.test(current)) continue;
          if (language === 'pt' && isPortugueseText(current) && !containsEnglishText(current)
            && applyPortuguese1945Orthography(current) === current) continue;
          if (language === 'pt' && !containsEnglishText(current) && !translatePortugueseInterfaceText(current)
            && applyPortuguese1945Orthography(current) === current) continue;
          if (!originals.has(name)) originals.set(name, current);
          const value = originals.get(name)!;
          items.push({ value, apply: translated => {
            if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
          } });
        }
      });
      return items;
    };

    const translate = () => {
      if (cancelled) return;
      document.documentElement.dataset.translationState = 'translating';
      setStatus('translating');
      const items = collect();
      const unique = [...new Set(items.map(item => item.value))];
      if (language === 'pt') {
        for (const text of unique) {
          const translated = translatePortugueseInterfaceText(text)
            || (applyPortuguese1945Orthography(text) !== text ? applyPortuguese1945Orthography(text) : undefined);
          if (translated) cache.set(`pt:${text}`, translated);
        }
      }
      if (!cancelled) {
        items.forEach(item => item.apply(cache.get(`${language}:${item.value}`) || item.value));
      }
      if (!cancelled) {
        const incomplete = items.some(item => {
          const translated = cache.get(`${language}:${item.value}`);
          return !translated || (translated === item.value && item.value.length > 20 && /\s/.test(item.value));
        });
        const nextStatus = incomplete ? 'partial' : 'translated';
        document.documentElement.dataset.translationState = nextStatus;
        setStatus(nextStatus);
      }
    };

    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(translate, 120); };
    restore();
    schedule();
    const observer = new MutationObserver(mutations => {
      let needsTranslation = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') { needsTranslation = true; continue; }
        if (mutation.type === 'characterData') {
          const text = mutation.target as Text;
          const current = text.data;
          const original = originalText.get(text);
          const expected = original ? cache.get(`${language}:${original.trim()}`) : undefined;
          if (!expected || current.trim() !== expected) {
            originalText.set(text, current);
            needsTranslation = true;
          }
          continue;
        }
        if (mutation.type === 'attributes') {
          const element = mutation.target as Element;
          const name = mutation.attributeName;
          if (!name) continue;
          const current = element.getAttribute(name) || '';
          let originals = originalAttributes.get(element);
          if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
          const original = originals.get(name);
          const expected = original ? cache.get(`${language}:${original}`) : undefined;
          if (!expected || current !== expected) {
            originals.set(name, current);
            needsTranslation = true;
          }
        }
      }
      if (needsTranslation) schedule();
    });
    observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: TRANSLATABLE_ATTRIBUTES, subtree: true });
    return () => {
      cancelled = true; window.clearTimeout(timer); observer.disconnect(); restore();
      delete document.documentElement.dataset.translationState;
    };
  }, [language, location.pathname]);

  if (language === 'en' || language === 'pt' || status === 'source' || status === 'translated') return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-no-translate
      className="fixed bottom-4 left-4 right-4 z-[100] rounded-md bg-navy px-4 py-3 text-sm font-medium text-white shadow-xl sm:left-auto sm:max-w-sm"
    >
      {status === 'translating'
        ? t('translation.applying', 'Applying the reviewed interface language…')
        : t('translation.partial', 'Reviewed navigation is translated. Longer interface passages remain in the English source language.')}
    </div>
  );
}
