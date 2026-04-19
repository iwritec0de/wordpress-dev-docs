'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SearchModal } from './SearchModal';
import { TocRight } from './TocRight';

interface NavLink {
  label: string;
  href: string;
}

interface AppShellProps {
  nav: { title: string; slug: string; items: { title: string; href: string; badge?: string }[] }[];
  title: string;
  navLinks?: NavLink[];
  githubUrl?: string;
  logo?: string;
  children: React.ReactNode;
}

export function AppShell({ nav, title, navLinks, githubUrl, logo, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        nav={nav}
        title={title}
        logo={logo}
        open={mobileMenuOpen}
        onClose={handleMenuClose}
      />
      <div className="flex flex-1 flex-col lg:ml-sidebar">
        <TopNav
          title={title}
          navLinks={navLinks}
          githubUrl={githubUrl}
          onMenuToggle={handleMenuToggle}
          onSearchOpen={handleSearchOpen}
        />
        <div
          className="flex flex-1 gap-8 px-4 pt-8 pb-16 sm:px-8"
          style={{ maxWidth: 'calc(var(--content-width) + var(--toc-width) + 96px)' }}
        >
          <main className="w-full max-w-content min-w-0 flex-1">{children}</main>
          <TocRight />
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={handleSearchClose} />
    </div>
  );
}
