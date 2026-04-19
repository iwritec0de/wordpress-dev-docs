import type { McpReference } from '../mcp/types.js';
import type { GuideSection } from '../../parser/guides/types.js';
import type { NavItem, NavSection } from './types.js';

/**
 * Flatten a parsed GuideSection (which may contain subsections) into a flat
 * list of NavItems. Top-level items come first, followed by each subsection's
 * items in order. Subsection titles are preserved as a prefix on the item
 * title so the hierarchy remains readable in a flat nav.
 */
function guideSectionToNavItems(section: GuideSection): NavItem[] {
  const items: NavItem[] = section.items.map((i) => ({
    title: i.title,
    href: `/${i.slug}`,
  }));
  for (const sub of section.subsections ?? []) {
    for (const i of sub.items) {
      items.push({
        title: `${sub.title} / ${i.title}`,
        href: `/${i.slug}`,
      });
    }
  }
  return items;
}

/**
 * Build the navigation structure from the MCP reference.
 * Sections are only included if they have content.
 * NavItems carry optional badge counts for quick orientation.
 *
 * If `guideSections` is provided (F2 mdx-guides), guide sections are
 * inserted directly after Overview and before PHP Reference. Empty guide
 * sections are skipped.
 */
export function buildNav(ref: McpReference, guideSections?: GuideSection[]): NavSection[] {
  const sections: NavSection[] = [];

  // Overview — always present
  sections.push({
    title: ref.name,
    slug: 'overview',
    icon: '🏠',
    items: [{ title: 'Overview', href: '/' }],
  });

  // Guides (F2 mdx-guides) — inserted before PHP Reference
  if (guideSections && guideSections.length > 0) {
    for (const guide of guideSections) {
      const items = guideSectionToNavItems(guide);
      if (items.length === 0) continue;
      sections.push({
        title: guide.title,
        slug: guide.slug,
        icon: '📖',
        items,
      });
    }
  }

  // PHP Reference
  const phpItems: NavItem[] = [];
  if (ref.functions.length > 0) {
    phpItems.push({
      title: 'Functions',
      href: '/php/functions',
      badge: String(ref.functions.length),
    });
  }
  if (ref.classes.length > 0) {
    phpItems.push({
      title: 'Classes',
      href: '/php/classes',
      badge: String(ref.classes.length),
    });
  }
  if (ref.constants.length > 0) {
    phpItems.push({
      title: 'Constants',
      href: '/php/constants',
      badge: String(ref.constants.length),
    });
  }
  if (phpItems.length > 0) {
    sections.push({ title: 'PHP Reference', slug: 'php', icon: '🐘', items: phpItems });
  }

  // Hooks
  const hookItems: NavItem[] = [];
  if (ref.hooks.actions.length > 0) {
    hookItems.push({
      title: 'Actions',
      href: '/hooks/actions',
      badge: String(ref.hooks.actions.length),
    });
  }
  if (ref.hooks.filters.length > 0) {
    hookItems.push({
      title: 'Filters',
      href: '/hooks/filters',
      badge: String(ref.hooks.filters.length),
    });
  }
  if (hookItems.length > 0) {
    sections.push({ title: 'Hooks', slug: 'hooks', icon: '🪝', items: hookItems });
  }

  // JavaScript API
  if (ref.js.functions.length > 0) {
    sections.push({
      title: 'JavaScript API',
      slug: 'js',
      icon: '🟨',
      items: [
        {
          title: 'Functions',
          href: '/js/functions',
          badge: String(ref.js.functions.length),
        },
      ],
    });
  }

  // REST API
  if (ref.restEndpoints.length > 0) {
    sections.push({
      title: 'REST API',
      slug: 'rest-api',
      icon: '🔌',
      items: [
        {
          title: 'Endpoints',
          href: '/rest-api/endpoints',
          badge: String(ref.restEndpoints.length),
        },
      ],
    });
  }

  // CSS / Design Tokens
  if (ref.cssTokens.length > 0) {
    sections.push({
      title: 'CSS / Design Tokens',
      slug: 'css',
      icon: '🎨',
      items: [
        {
          title: 'Design Tokens',
          href: '/css/tokens',
          badge: String(ref.cssTokens.length),
        },
      ],
    });
  }

  // Changelog — always shown in nav; page handles empty state
  sections.push({
    title: 'Changelog',
    slug: 'changelog',
    icon: '📋',
    items: [{ title: 'Changelog', href: '/changelog' }],
  });

  return sections;
}
