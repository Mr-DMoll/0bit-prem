// Stale-while-revalidate cache for PUBLIC, non-user-specific GETs (content, album
// list, gallery, events, merch list). Never use it for anything that depends on who
// is logged in (album ownership, orders, sanctum mix) — the cache is shared by all
// users of this browser and persists across sessions.
//
// Behaviour per key:
//   fresh  (< FRESH_MS)  -> returned immediately, no network
//   stale  (< STALE_MS)  -> returned immediately, refreshed in the background so the
//                           NEXT read is current
//   older / missing      -> waits for the network
// Concurrent callers for the same key share one request.

const FRESH_MS = 60 * 1000;
const STALE_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = "pk_cache:";

interface Entry { at: number; data: unknown }

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

function readStored(key: string): Entry | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Entry) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, entry: Entry) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full or blocked (private mode) — the in-memory copy still works.
  }
}

function refresh<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fetcher()
    .then((data) => {
      const entry = { at: Date.now(), data };
      memory.set(key, entry);
      writeStored(key, entry);
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Server render / no window: nothing to cache against, just fetch.
  if (typeof window === "undefined") return fetcher();

  const entry = memory.get(key) ?? readStored(key);
  if (entry) memory.set(key, entry);

  const age = entry ? Date.now() - entry.at : Infinity;

  if (entry && age < FRESH_MS) return Promise.resolve(entry.data as T);

  if (entry && age < STALE_MS) {
    refresh(key, fetcher).catch(() => {});
    return Promise.resolve(entry.data as T);
  }

  return refresh(key, fetcher).catch((err) => {
    // Network down: an old copy beats an error page.
    if (entry) return entry.data as T;
    throw err;
  });
}

/** Warm the cache without caring about the result (used for idle prefetching). */
export function prefetch<T>(key: string, fetcher: () => Promise<T>) {
  cachedGet(key, fetcher).catch(() => {});
}

/** Drop everything — called after any admin write so the editor sees their own change. */
export function clearCache() {
  memory.clear();
  if (typeof window === "undefined") return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}
