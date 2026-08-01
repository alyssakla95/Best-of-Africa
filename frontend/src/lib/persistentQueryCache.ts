// Increment when a previously valid cached response can hide newly available
// reader content. v3 can contain article payloads saved before Portuguese
// metadata and pre-AO90 prose normalization was completed. A new namespace
// makes corrected copy and source-image metadata visible on the next app open.
const CACHE_NAME = 'boa-reader-data-v4';
const CACHE_PREFIX = '/__boa_reader_cache__/';

interface CacheEnvelope<T> {
  data: T;
  savedAt: number;
}

const inFlight = new Map<string, Promise<unknown>>();

function cacheRequest(key: string): Request {
  return new Request(`${window.location.origin}${CACHE_PREFIX}${encodeURIComponent(key)}`);
}

async function save<T>(key: string, data: T): Promise<T> {
  if (typeof window === 'undefined' || !('caches' in window)) return data;
  const cache = await window.caches.open(CACHE_NAME);
  const envelope: CacheEnvelope<T> = { data, savedAt: Date.now() };
  await cache.put(cacheRequest(key), new Response(JSON.stringify(envelope), {
    headers: { 'Content-Type': 'application/json' },
  }));
  return data;
}

async function load<T>(key: string): Promise<CacheEnvelope<T> | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await window.caches.open(CACHE_NAME);
    const response = await cache.match(cacheRequest(key));
    return response ? await response.json() as CacheEnvelope<T> : null;
  } catch {
    return null;
  }
}

export async function readPersistentCache<T>(key: string, maxAgeMs: number): Promise<T | null> {
  const cached = await load<T>(key);
  return cached && Date.now() - cached.savedAt <= maxAgeMs ? cached.data : null;
}

export async function writePersistentCache<T>(key: string, value: T): Promise<T> {
  return save(key, value);
}

function fetchOnce<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = loader().then(data => save(key, data)).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

/**
 * Device-persistent stale-while-revalidate data cache. A saved response is
 * returned immediately and refreshed without blocking the current view.
 */
export async function readThroughCache<T>(
  key: string,
  loader: () => Promise<T>,
  maxAgeMs = 30 * 24 * 60 * 60 * 1000,
): Promise<T> {
  const cached = await load<T>(key);
  if (cached && Date.now() - cached.savedAt <= maxAgeMs) {
    void fetchOnce(key, loader).catch(() => undefined);
    return cached.data;
  }

  try {
    return await fetchOnce(key, loader);
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}

export function clearReaderDataCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return Promise.resolve(false);
  return window.caches.delete(CACHE_NAME);
}
