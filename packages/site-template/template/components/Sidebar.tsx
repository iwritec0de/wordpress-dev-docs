'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

interface NavItem {
  title: string;
  href: string;
  badge?: string;
}

interface NavSection {
  title: string;
  slug: string;
  items: NavItem[];
}

interface SidebarProps {
  nav: NavSection[];
  title: string;
  logo?: string;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ nav, title, logo, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Track which sections are collapsed (all expanded by default)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((slug: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    onClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand section containing the active page
  useEffect(() => {
    for (const section of nav) {
      const hasActive = section.items.some(
        (item) => pathname === item.href || pathname === item.href.replace(/\/$/, '')
      );
      if (hasActive && collapsed.has(section.slug)) {
        setCollapsed((prev) => {
          const next = new Set(prev);
          next.delete(section.slug);
          return next;
        });
      }
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Extract first letter for logo icon
  const logoLetter = title.charAt(0).toUpperCase();

  function renderNav() {
    return nav.map((section) => {
      const isCollapsed = collapsed.has(section.slug);
      const isOverview = section.slug === 'overview';

      return (
        <div key={section.slug} className="mb-6">
          {!isOverview && (
            <button
              type="button"
              onClick={() => toggleSection(section.slug)}
              className="mb-1 flex w-full items-center justify-between px-2 text-xs font-medium uppercase tracking-wider text-muted transition-colors hover:text-fg font-display"
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${section.title} section`}
            >
              <span>{section.title}</span>
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
              >
                <polyline points="3 4.5 6 7.5 9 4.5" />
              </svg>
            </button>
          )}
          {(!isCollapsed || isOverview) && (
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname === item.href.replace(/\/$/, '');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between border-l-2 px-3 py-1.5 text-sm transition-all duration-150 ${
                        isActive
                          ? 'border-accent bg-sidebar-active font-medium text-accent'
                          : 'border-transparent text-fg hover:border-muted hover:bg-sidebar-active'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    });
  }

  const sidebarHeader = (
    <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-base font-bold no-underline transition-colors hover:text-accent font-display"
      >
        {logo ? (
          <img src={logo} alt="" className="h-7 w-7 object-contain rounded-sm" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center text-sm font-bold text-accent-fg bg-accent rounded-sm">
            {logoLetter}
          </div>
        )}
        <span>{title}</span>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-sidebar-bg transition-colors lg:flex w-sidebar">
        {sidebarHeader}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Documentation navigation">
          {renderNav()}
        </nav>
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar-bg">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-base font-bold no-underline font-display"
              >
                {logo ? (
                  <img src={logo} alt="" className="h-7 w-7 object-contain rounded-sm" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center text-sm font-bold text-accent-fg bg-accent rounded-sm">
                    {logoLetter}
                  </div>
                )}
                <span>{title}</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1 text-muted hover:text-fg"
                aria-label="Close navigation"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Documentation navigation">
              {renderNav()}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
