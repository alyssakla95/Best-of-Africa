import { useCallback, useEffect, useState } from 'react';

type PortugueseTranslator = (value: string) => string | undefined;

let cachedTranslator: PortugueseTranslator | undefined;
let cataloguePromise: Promise<PortugueseTranslator> | undefined;

function loadTranslator(): Promise<PortugueseTranslator> {
  if (cachedTranslator) return Promise.resolve(cachedTranslator);
  if (!cataloguePromise) {
    cataloguePromise = import('./pt-PT-1945').then(module => {
      cachedTranslator = module.translatePortugueseInterfaceText;
      return cachedTranslator;
    });
  }
  return cataloguePromise;
}

/** Load the reviewed Portuguese catalogue only for a Portuguese reader. */
export function usePortugueseCatalogue(enabled: boolean): PortugueseTranslator {
  const [translator, setTranslator] = useState<PortugueseTranslator | undefined>(() => (
    enabled ? cachedTranslator : undefined
  ));

  useEffect(() => {
    let active = true;
    if (!enabled) {
      return () => { active = false; };
    }
    void loadTranslator().then(next => {
      if (active) setTranslator(() => next);
    });
    return () => { active = false; };
  }, [enabled]);

  return useCallback((value: string) => translator?.(value), [translator]);
}
