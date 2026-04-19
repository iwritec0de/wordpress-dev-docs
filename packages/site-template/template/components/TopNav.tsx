'use client';

import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavLink {
  label: string;
  href: string;
}

interface TopNavProps {
  title: string;
  navLinks?: NavLink[];
  githubUrl?: string;
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

export function TopNav({ title, navLinks, githubUrl, onMenuToggle, onSearchOpen }: TopNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border px-4 backdrop-blur-md sm:px-6"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        transition: 'background var(--transition-base), border-color var(--transition-base)',
      }}
    >
      {/* Left: mobile menu + breadcrumb + section nav */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-sm p-1.5 text-muted transition-colors hover:text-fg lg:hidden"
          aria-label="Open navigation menu"
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
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span className="text-sm font-medium text-muted whitespace-nowrap">{title}</span>

        {/* Section nav links */}
        {navLinks && navLinks.length > 0 && (
          <>
            <div className="hidden h-5 w-px lg:block bg-border" />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Section navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 py-1 text-[13px] transition-colors ${
                      isActive ? 'font-medium text-accent' : 'text-muted hover:text-fg'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Center: search trigger */}
      <button
        type="button"
        onClick={onSearchOpen}
        className="ml-auto mr-3 hidden items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-accent sm:flex"
        style={{ minWidth: '260px' }}
        aria-label="Search documentation"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Search docs...</span>
        <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[11px]">
          &#8984;K
        </kbd>
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* GitHub link */}
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-fg"
            aria-label="View on GitHub"
            title="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        )}

        {/* Dark mode toggle */}
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-fg"
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
