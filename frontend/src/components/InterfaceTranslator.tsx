import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { request } from '../services/api';
import { TRANSLATIONS } from '../i18n/dict';
import { readPersistentCache, writePersistentCache } from '../lib/persistentQueryCache';

type TranslationResponse = { translations: string[] };
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const cache = new Map<string, string>();
const SKIP = 'script,style,code,pre,textarea,[contenteditable="true"],[data-no-translate]';
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'];
const MAX_BATCH_ITEMS = 24;
const MAX_BATCH_CHARS = 12000;
const PERSISTENT_TRANSLATION_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const translationCacheKey = (language: string, text: string) => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ui-translation:${language}:${text.length}:${(hash >>> 0).toString(36)}`;
};

export function InterfaceTranslator() {
    const { language } = useLanguage();
    const location = useLocation();
    const [status, setStatus] = useState<'source' | 'translating' | 'translated' | 'partial'>('source');

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    // Resolve maintained interface strings locally; dynamic copy uses the publication translation service.
    for (const [key, english] of Object.entries(TRANSLATIONS.en || {})) {
      const translated = TRANSLATIONS[language]?.[key];
      if (translated) cache.set(`${language}:${english}`, translated);
    }

    const restore = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        const original = originalText.get(text);
        if (original !== undefined) text.data = original;
      }
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(element => {
        const originals = originalAttributes.get(element);
        originals?.forEach((value, name) => element.setAttribute(name, value));
      });
    };

    const collect = () => {
      const items: Array<{ value: string; apply: (translated: string) => void }> = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          const value = node.textContent?.trim() || '';
          const sourceLanguage = parent?.closest<HTMLElement>('[data-source-language]')?.dataset.sourceLanguage;
          if (!parent || parent.closest(SKIP) || sourceLanguage === language || !value || !/[A-Za-z]/.test(value)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        if (!originalText.has(text)) originalText.set(text, text.data);
        const value = originalText.get(text)!;
        items.push({ value: value.trim(), apply: translated => { text.data = value.replace(value.trim(), translated); } });
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
          if (!originals.has(name)) originals.set(name, current);
          const value = originals.get(name)!;
          items.push({ value, apply: translated => element.setAttribute(name, translated) });
        }
      });
      return items;
    };

    const batchesFor = (values: string[]) => {
      const batches: string[][] = [];
      let batch: string[] = [];
      let characters = 0;
      for (const value of values) {
        if (batch.length && (batch.length >= MAX_BATCH_ITEMS || characters + value.length > MAX_BATCH_CHARS)) {
          batches.push(batch); batch = []; characters = 0;
        }
        batch.push(value); characters += value.length;
      }
      if (batch.length) batches.push(batch);
      return batches;
    };

    const translate = async () => {
      if (cancelled) return;
      if (language === 'en') { restore(); document.documentElement.dataset.translationState = 'source'; setStatus('source'); return; }
      document.documentElement.dataset.translationState = 'translating';
      setStatus('translating');
      const items = collect();
      const unique = [...new Set(items.map(item => item.value))];
      await Promise.all(unique.map(async text => {
        const key = `${language}:${text}`;
        if (cache.has(key)) return;
        const persisted = await readPersistentCache<string>(translationCacheKey(language, text), PERSISTENT_TRANSLATION_AGE_MS);
        if (persisted) cache.set(key, persisted);
      }));
      for (const batch of batchesFor(unique)) {
        if (cancelled) break;
        const missing = batch.filter(text => !cache.has(`${language}:${text}`));
        if (missing.length) {
          try {
            const result = await request<TranslationResponse>('/translate/interface', {
              method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' },
              body: JSON.stringify({ language, texts: missing }),
            });
            missing.forEach((text, index) => {
              const translated = result.translations[index];
              if (translated) {
                cache.set(`${language}:${text}`, translated);
                void writePersistentCache(translationCacheKey(language, text), translated);
              }
            });
          } catch { /* The visible partial state below tells the reader English remains. */ }
        }
        if (!cancelled) items.filter(item => batch.includes(item.value)).forEach(item => item.apply(cache.get(`${language}:${item.value}`) || item.value));
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

  if (language === 'en' || status === 'source' || status === 'translated') return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-no-translate
      className="fixed bottom-4 left-4 right-4 z-[100] rounded-md bg-navy px-4 py-3 text-sm font-medium text-white shadow-xl sm:left-auto sm:max-w-sm"
    >
      {status === 'translating'
        ? 'Translating this page…'
        : 'Some text remains in English because translation could not be completed. Try again shortly.'}
    </div>
  );
}
