'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import siteData from '@/public/data/site-data.json';

interface NavItem {
  title: string;
  href: string;
}

/**
 * Prev/Next page navigation shown at the bottom of content pages.
 * Derives order from the site nav structure.
 */
export function PrevNextNav() {
  const pathname = usePathname();

  // Flatten all nav items into a sequential list
  const allItems: NavItem[] = [];
  for (const section of siteData.nav) {
    for (const item of section.items) {
      allItems.push({ title: item.title, href: item.href });
    }
  }

  const currentIndex = allItems.findIndex(
    (item) => item.href === pathname || item.href === pathname + '/'
  );
  if (currentIndex === -1) return null;

  const prev = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const next = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  if (!prev && !next) return null;

  return (
    <nav
      className="mt-16 flex items-stretch gap-4 border-t border-border pt-8"
      aria-label="Page navigation"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-1 flex-col rounded-md border border-border px-5 py-4 transition-all hover:border-accent hover:shadow-sm"
        >
          <span className="mb-1 text-xs font-medium text-muted">← Previous</span>
          <span className="text-sm font-medium text-fg group-hover:text-accent font-display">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex flex-1 flex-col items-end rounded-md border border-border px-5 py-4 text-right transition-all hover:border-accent hover:shadow-sm"
        >
          <span className="mb-1 text-xs font-medium text-muted">Next →</span>
          <span className="text-sm font-medium text-fg group-hover:text-accent font-display">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
