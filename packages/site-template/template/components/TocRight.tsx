'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export function TocRight() {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from the DOM on mount and when content changes
  useEffect(() => {
    function collectHeadings() {
      const main = document.querySelector('main');
      if (!main) return;
      const collected: TocHeading[] = [];

      // MDX pages: headings with IDs
      const headingNodes = main.querySelectorAll('h2[id], h3[id]');
      headingNodes.forEach((node) => {
        const el = node as HTMLElement;
        if (el.id) {
          collected.push({
            id: el.id,
            text: el.textContent?.trim() ?? '',
            level: el.tagName === 'H2' ? 2 : 3,
          });
        }
      });

      // Reference pages: section cards with IDs (functions, hooks, classes, endpoints)
      if (collected.length === 0) {
        const sections = main.querySelectorAll('section[id]');
        sections.forEach((node) => {
          const el = node as HTMLElement;
          if (el.id) {
            collected.push({
              id: el.id,
              text: el.id,
              level: 2,
            });
          }
        });
      }

      setHeadings(collected);
    }

    collectHeadings();

    // Re-collect when DOM changes (e.g. client-side navigation)
    const mo = new MutationObserver(collectHeadings);
    const main = document.querySelector('main');
    if (main) {
      mo.observe(main, { childList: true, subtree: true });
    }

    return () => mo.disconnect();
  }, []);

  // IntersectionObserver to track which heading is visible
  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current?.disconnect();

    const callback: IntersectionObserverCallback = (entries) => {
      // Find the first visible entry closest to the top
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-64px 0px -60% 0px',
      threshold: 0,
    });

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL hash without scrolling
      window.history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside
      className="sticky top-[88px] hidden max-h-[calc(100vh-120px)] overflow-y-auto border-l border-border pl-6 xl:block w-toc"
      aria-label="On this page"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted font-display">
        On this page
      </p>
      <nav>
        <ul className="space-y-1">
          {headings.map(({ id, text, level }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className={`block py-[3px] text-[0.8125rem] transition-colors ${
                  level === 3 ? 'pl-3' : ''
                } ${activeId === id ? 'font-medium text-accent' : 'text-muted hover:text-fg'}`}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
