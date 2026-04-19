'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FlexSearch from 'flexsearch';

interface SearchEntry {
  id: string;
  title: string;
  type: string;
  description: string;
  href: string;
  tags?: string[];
  body?: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  function: 'Function',
  class: 'Class',
  hook: 'Hook',
  constant: 'Constant',
  'css-token': 'CSS Token',
  'rest-endpoint': 'REST',
  'rest-field': 'REST Field',
  'js-function': 'JS Function',
  page: 'Page',
  guide: 'Guide',
};

const TYPE_COLORS: Record<string, string> = {
  function: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  hook: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  constant: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'css-token': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'rest-endpoint': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'rest-field': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'js-function': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  page: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  guide: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

// Module-level cache so the index is built only once across mounts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- FlexSearch 0.7 types are incomplete
let cachedIndex: any = null;
let cachedEntries: SearchEntry[] = [];
let loadPromise: Promise<void> | null = null;

function buildIndex(entries: SearchEntry[]) {
  // FlexSearch.Document types are incomplete in 0.7.x; use runtime API directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Doc = (FlexSearch as any).Document ?? FlexSearch.Document;
  const index = new Doc({
    document: {
      id: 'id',
      index: [
        { field: 'title', tokenize: 'forward', resolution: 9 },
        { field: 'description', tokenize: 'forward', resolution: 5 },
        { field: 'body', tokenize: 'forward', resolution: 3 },
      ],
      store: ['title', 'type', 'description', 'href'],
    },
  });

  for (const entry of entries) {
    index.add(entry);
  }

  return index;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>(cachedEntries);
  const [indexReady, setIndexReady] = useState(() => cachedIndex !== null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Load search index once. Uses a module-level promise to deduplicate
  // concurrent fetches from multiple mounts (Suspense transitions, HMR).
  useEffect(() => {
    if (!open) return;
    if (cachedIndex) {
      setIndexReady(true);
      setEntries(cachedEntries);
      return;
    }
    if (!loadPromise) {
      loadPromise = fetch('/data/search-index.json')
        .then((res) => res.json())
        .then((data) => {
          if (data?.entries) {
            cachedEntries = data.entries;
            cachedIndex = buildIndex(data.entries);
          }
        })
        .catch(() => {});
    }
    let cancelled = false;
    loadPromise.then(() => {
      if (!cancelled && cachedIndex) {
        setEntries(cachedEntries);
        setIndexReady(true);
      }
    });
    return () => { cancelled = true; };
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Build a lookup map for O(1) entry resolution
  const entryMap = useMemo(() => {
    const map = new Map<string, SearchEntry>();
    for (const e of entries) map.set(e.id, e);
    return map;
  }, [entries]);

  // Search using FlexSearch. `indexReady` is included as a dependency so the
  // memo recomputes once the index finishes loading — the actual search runs
  // against the module-level `cachedIndex` which is guaranteed to be set when
  // `indexReady` is true.
  const results = useMemo(() => {
    if (!query.trim() || !indexReady || !cachedIndex || entryMap.size === 0) return [];

    const searchResults = cachedIndex.search(query, { limit: 20 });

    const seen = new Set<string>();
    const ranked: SearchEntry[] = [];

    for (const fieldResult of searchResults) {
      const ids: unknown[] = fieldResult.result ?? fieldResult;
      for (const item of ids) {
        const id = String(
          typeof item === 'object' && item !== null ? (item as Record<string, unknown>).id : item
        );
        if (seen.has(id)) continue;
        seen.add(id);
        const entry = entryMap.get(id);
        if (entry) ranked.push(entry);
      }
    }

    return ranked.slice(0, 20);
  }, [query, entryMap, indexReady]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const navigate = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        navigate(results[activeIndex].href);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [results, activeIndex, navigate, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="fixed left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-bg shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b border-border px-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="h-12 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted"
            aria-label="Search"
            aria-activedescendant={
              results[activeIndex] ? `search-result-${activeIndex}` : undefined
            }
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto" role="listbox">
          {query.trim() && results.length === 0 && indexReady && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {query.trim() && !indexReady && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Loading search index&hellip;
            </div>
          )}
          {results.map((entry, i) => (
            <button
              key={entry.id}
              id={`search-result-${i}`}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors ${
                i === activeIndex ? 'bg-sidebar-active' : 'hover:bg-surface'
              }`}
              onClick={() => navigate(entry.href)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  TYPE_COLORS[entry.type] ?? TYPE_COLORS['page']
                }`}
              >
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{entry.title}</div>
                {entry.description && (
                  <div className="mt-0.5 truncate text-xs text-muted">{entry.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted">
            <span>
              <kbd className="rounded border border-border px-1 py-0.5">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded border border-border px-1 py-0.5">↵</kbd> open
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
