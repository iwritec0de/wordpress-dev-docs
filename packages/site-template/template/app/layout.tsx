import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppShell } from '@/components/AppShell';
import './globals.css';
import siteData from '@/public/data/site-data.json';

export const metadata: Metadata = {
  title: siteData.meta.title || 'Documentation',
  description: siteData.meta.description || '',
};

// Build top-level section nav links from nav structure
const NAV_SECTION_MAP: Record<string, string> = {
  guides: 'Guides',
  intro: 'Guides',
  quickstart: 'Guides',
  'php-reference': 'API',
  hooks: 'Hooks',
  js: 'JS',
  'rest-api': 'REST API',
  css: 'Tokens',
  changelog: 'Changelog',
};

function buildNavLinks() {
  const seen = new Set<string>();
  const links: { label: string; href: string }[] = [];

  for (const section of siteData.nav) {
    const label = NAV_SECTION_MAP[section.slug];
    if (label && !seen.has(label) && section.items.length > 0) {
      seen.add(label);
      links.push({ label, href: section.items[0].href });
    }
  }

  return links.length > 1 ? links : undefined;
}

const sectionNavLinks = buildNavLinks();

// Merge auto-generated section nav links with user-configured external links
const navLinks = [
  ...(sectionNavLinks ?? []),
  ...(((siteData.meta as Record<string, unknown>).navLinks as { label: string; href: string }[]) ??
    []),
];

const githubUrl = (siteData.meta as Record<string, unknown>).githubUrl as string | undefined;
const logo = (siteData.meta as Record<string, unknown>).logo as string | undefined;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth scroll-pt-20">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-fg">
        <ThemeProvider>
          <AppShell
            nav={siteData.nav}
            title={siteData.meta.title}
            navLinks={navLinks.length > 0 ? navLinks : undefined}
            githubUrl={githubUrl}
            logo={logo}
          >
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
