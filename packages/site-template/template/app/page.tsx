import siteData from '@/public/data/site-data.json';

interface NavSection {
  title: string;
  slug: string;
  items: { title: string; href: string }[];
}

const STATIC_GUIDE_CARDS = [
  {
    title: 'Hooks & Filters',
    description: 'Customize behavior with actions and filters. Full reference with examples.',
    href: '/hooks/actions/',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    darkIconBg: '#78350f60',
    darkIconColor: '#fbbf24',
    svgPath: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
  },
  {
    title: 'CSS Tokens',
    description: 'Design tokens for consistent theming across your project.',
    href: '/css/tokens/',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    darkIconBg: '#2e106560',
    darkIconColor: '#a78bfa',
    svgPath: (
      <>
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="10.5" r="2.5" />
        <circle cx="8.5" cy="7.5" r="2.5" />
        <circle cx="6.5" cy="12.5" r="2.5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </>
    ),
  },
];

function buildGuideCards(nav: NavSection[]) {
  // Find guide sections from nav (slugs starting with "guides/")
  const guideSections = nav.filter((s) => s.slug.startsWith('guides/'));

  if (guideSections.length === 0) return STATIC_GUIDE_CARDS;

  const GUIDE_ICONS = [
    {
      iconBg: '#dbeafe',
      iconColor: '#2563eb',
      darkIconBg: '#1e3a5f60',
      darkIconColor: '#60a5fa',
      svgPath: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    },
    {
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      darkIconBg: '#14532d60',
      darkIconColor: '#4ade80',
      svgPath: (
        <>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
          <path d="M20 3v4h-4" />
        </>
      ),
    },
    {
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      darkIconBg: '#78350f60',
      darkIconColor: '#fbbf24',
      svgPath: (
        <>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </>
      ),
    },
    {
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      darkIconBg: '#2e106560',
      darkIconColor: '#a78bfa',
      svgPath: (
        <>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </>
      ),
    },
  ];

  const cards = guideSections.slice(0, 4).map((section, i) => {
    const icon = GUIDE_ICONS[i % GUIDE_ICONS.length];
    const firstItem = section.items[0];
    return {
      title: section.title,
      description: `${section.items.length} guide${section.items.length !== 1 ? 's' : ''} in this section.`,
      href: firstItem?.href ?? '#',
      ...icon,
    };
  });

  // Append static cards (hooks, css) after guide cards
  return [...cards, ...STATIC_GUIDE_CARDS];
}

export default function Home() {
  const { meta, reference, nav } = siteData as unknown as {
    meta: typeof siteData.meta;
    reference: typeof siteData.reference & { restEndpoints?: unknown[] };
    nav: NavSection[];
  };

  const restEndpoints = reference.restEndpoints ?? [];
  const guideCards = buildGuideCards(nav);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold text-accent font-display">Documentation</p>
        <h1 className="mb-2 text-3xl font-bold leading-tight font-display">{meta.title}</h1>
        {meta.description && (
          <p className="text-base leading-relaxed text-muted">{meta.description}</p>
        )}
      </div>

      {/* Quick Reference Stats */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="PHP Functions" count={reference.functions.length} href="/php/functions/" />
        <StatCard label="Classes" count={reference.classes.length} href="/php/classes/" />
        <StatCard label="Actions" count={reference.hooks.actions.length} href="/hooks/actions/" />
        <StatCard label="Filters" count={reference.hooks.filters.length} href="/hooks/filters/" />
        <StatCard label="CSS Tokens" count={reference.cssTokens.length} href="/css/tokens/" />
        {restEndpoints.length > 0 && (
          <StatCard
            label="REST Endpoints"
            count={restEndpoints.length}
            href="/rest-api/endpoints/"
          />
        )}
      </div>

      {/* Guide Cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {guideCards.slice(0, 6).map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="group block no-underline border border-border p-6 transition-all hover:border-accent rounded-lg"
          >
            <div
              className="icon-card mb-3 flex h-10 w-10 items-center justify-center rounded-sm"
              style={
                {
                  '--_icon-bg': card.iconBg,
                  '--_icon-fg': card.iconColor,
                  '--_icon-dark-bg': card.darkIconBg,
                  '--_icon-dark-fg': card.darkIconColor,
                } as React.CSSProperties
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {card.svgPath}
              </svg>
            </div>
            <h3 className="mb-1 text-base font-semibold text-fg font-display">{card.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{card.description}</p>
          </a>
        ))}
      </div>

      {/* Separator */}
      <hr className="my-8 border-border" />

      {/* PHP Functions preview heading */}
      <h2 className="mb-4 border-b border-border pb-3 text-xl font-semibold font-display">
        PHP Functions
      </h2>
      <p className="text-sm text-muted">
        <a href="/php/functions/" className="text-accent hover:underline">
          View all {reference.functions.length} functions &rarr;
        </a>
      </p>
    </div>
  );
}

function StatCard({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col no-underline text-inherit border border-border p-5 transition-all hover:border-accent hover:-translate-y-0.5 rounded-md shadow-sm"
    >
      <span className="text-2xl font-bold leading-none font-display">{count}</span>
      <span className="mt-1 text-sm text-muted">{label}</span>
    </a>
  );
}
