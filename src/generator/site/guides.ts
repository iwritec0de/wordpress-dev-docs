import { join, dirname } from 'path';
import { mkdirSync, writeFileSync, copyFileSync } from 'fs';
import type { Guide, GuideSection, GuideNavItem } from '../../parser/guides/types.js';
import { rewriteRefs } from '../../parser/guides/rewrite-refs.js';

/**
 * Build GuideSection[] from a flat list of parsed Guide objects.
 * Groups guides by section (and optionally subsection), producing the
 * navigation structure that buildNav() consumes.
 *
 * Hidden guides are excluded from navigation but still written to disk.
 */
export function buildGuideSections(guides: Guide[]): GuideSection[] {
  const sectionMap = new Map<
    string,
    {
      title: string;
      slug: string;
      items: GuideNavItem[];
      subsections: Map<string, { title: string; slug: string; items: GuideNavItem[] }>;
    }
  >();

  for (const guide of guides) {
    if (guide.hidden) continue;

    let sec = sectionMap.get(guide.section);
    if (!sec) {
      sec = {
        title: toTitleCase(guide.section),
        slug: `guides/${guide.section}`,
        items: [],
        subsections: new Map(),
      };
      sectionMap.set(guide.section, sec);
    }

    const navItem: GuideNavItem = {
      title: guide.title,
      slug: guideSlug(guide),
    };

    if (guide.subsection) {
      let sub = sec.subsections.get(guide.subsection);
      if (!sub) {
        sub = {
          title: toTitleCase(guide.subsection),
          slug: `guides/${guide.section}/${guide.subsection}`,
          items: [],
        };
        sec.subsections.set(guide.subsection, sub);
      }
      sub.items.push(navItem);
    } else {
      sec.items.push(navItem);
    }
  }

  const sections: GuideSection[] = [];
  for (const sec of sectionMap.values()) {
    const subsections: GuideSection[] = [];
    for (const sub of sec.subsections.values()) {
      subsections.push({ title: sub.title, slug: sub.slug, items: sub.items });
    }
    sections.push({
      title: sec.title,
      slug: sec.slug,
      items: sec.items,
      ...(subsections.length > 0 ? { subsections } : {}),
    });
  }

  return sections;
}

/**
 * Write guide MDX files into the scaffolded Next.js site's app/ directory.
 *
 * Each guide becomes `app/guides/<section>/[<subsection>/]<slug>/page.mdx`.
 * Returns the list of file paths written.
 */
export function writeGuidePages(guides: Guide[], outputDir: string): string[] {
  const written: string[] = [];

  for (const guide of guides) {
    // Rewrite relative image/link refs before writing
    const { body: rewrittenBody, assets } = rewriteRefs(
      guide.body,
      guide.sourcePath,
      guide.section,
      guide.subsection
    );

    const slug = guideSlug(guide);
    const pageDir = join(outputDir, 'app', slug);
    mkdirSync(pageDir, { recursive: true });

    // Write MDX as content.mdx (pure content, no metadata export)
    const mdxPath = join(pageDir, 'content.mdx');
    const mdxContent = buildGuideMdx({ ...guide, body: rewrittenBody });
    mkdirSync(pageDir, { recursive: true });
    writeFileSync(mdxPath, mdxContent, 'utf8');
    written.push(mdxPath);

    // Write page.tsx wrapper that exports metadata (server component)
    const pageTsx = buildGuidePageWrapper(guide);
    const pageTsxPath = join(pageDir, 'page.tsx');
    writeFileSync(pageTsxPath, pageTsx, 'utf8');
    written.push(pageTsxPath);

    // Copy referenced assets into public/data/guides/_assets/
    for (const asset of assets) {
      const destPath = join(outputDir, 'public', 'data', asset.dest);
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(asset.src, destPath);
      written.push(destPath);
    }
  }

  return written;
}

/** Build the route slug for a guide: guides/<section>/[<subsection>/]<slug> */
function guideSlug(guide: Guide): string {
  const parts = ['guides', guide.section];
  if (guide.subsection) parts.push(guide.subsection);
  parts.push(guide.slug);
  return parts.join('/');
}

/**
 * Wrap guide body in a Next.js-compatible MDX page.
 *
 * MDX pages processed through @next/mdx with custom components become client
 * components, so we cannot use `export const metadata` (server-only).
 * Instead, ensure an h1 heading exists for the page title.
 */
function buildGuideMdx(guide: Guide): string {
  const lines: string[] = [];

  // Add h1 heading if the body doesn't already start with one
  const hasH1 = /^#\s+/m.test(guide.body.trim());
  if (!hasH1) {
    lines.push(`# ${guide.title}`);
    lines.push('');
  }

  // Guide body (already has frontmatter stripped by the parser)
  lines.push(guide.body);

  return lines.join('\n');
}

/**
 * Build a page.tsx server component wrapper that exports metadata
 * and renders the MDX content component.
 */
function buildGuidePageWrapper(guide: Guide): string {
  const lines = [
    `import type { Metadata } from 'next';`,
    `import Content from './content.mdx';`,
    `import { PrevNextNav } from '@/components/PrevNextNav';`,
    ``,
    `export const metadata: Metadata = {`,
    `  title: ${JSON.stringify(guide.title)},`,
  ];
  if (guide.description) {
    lines.push(`  description: ${JSON.stringify(guide.description)},`);
  }
  lines.push(`};`);
  lines.push(``);
  lines.push(`export default function Page() {`);
  lines.push(`  return (`);
  lines.push(`    <>`);
  lines.push(`      <div className="mdx-content">`);
  lines.push(`        <Content />`);
  lines.push(`      </div>`);
  lines.push(`      <PrevNextNav />`);
  lines.push(`    </>`);
  lines.push(`  );`);
  lines.push(`}`);
  lines.push(``);
  return lines.join('\n');
}

function toTitleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
