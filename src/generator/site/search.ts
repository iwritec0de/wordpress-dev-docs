import type { McpReference } from '../mcp/types.js';
import type { Guide } from '../../parser/guides/types.js';
import type { NavSection, SearchEntry, SearchIndex } from './types.js';

/**
 * Build a flat search index from the MCP reference, navigation sections, and
 * optional guide content.
 *
 * The index is written to `public/data/search-index.json` and can be consumed
 * by client-side search (e.g. Fuse.js or a simple text scan).
 */
export function buildSearchIndex(
  reference: McpReference,
  nav: NavSection[],
  guides: Guide[] = []
): SearchIndex {
  const entries: SearchEntry[] = [];

  // Nav pages (type: 'page') — one entry per nav item
  for (const section of nav) {
    for (const item of section.items) {
      entries.push({
        id: `page:${item.href}`,
        title: item.title,
        type: 'page',
        description: `${section.title} — ${item.title}`,
        href: item.href,
      });
    }
  }

  // PHP functions
  for (const fn of reference.functions) {
    entries.push({
      id: `function:${fn.name}`,
      title: fn.name,
      type: 'function',
      description: fn.description ?? '',
      href: `/php/functions#${fn.name}`,
      tags: ['php', 'function'],
    });
  }

  // PHP classes
  for (const cls of reference.classes) {
    entries.push({
      id: `class:${cls.name}`,
      title: cls.name,
      type: 'class',
      description: cls.description ?? '',
      href: `/php/classes#${cls.name}`,
      tags: ['php', 'class'],
    });
  }

  // PHP constants
  for (const constant of reference.constants) {
    entries.push({
      id: `constant:${constant.name}`,
      title: constant.name,
      type: 'constant',
      description: constant.description ?? '',
      href: `/php/constants#${constant.name}`,
      tags: ['php', 'constant'],
    });
  }

  // WordPress hooks (actions) — a hook dispatched from multiple files would
  // produce duplicate same-name entries, so we collapse by name and keep the
  // first occurrence (which is also the anchor target on the rendered page).
  const seenActions = new Set<string>();
  for (const hook of reference.hooks.actions) {
    if (seenActions.has(hook.name)) continue;
    seenActions.add(hook.name);
    entries.push({
      id: `hook:action:${hook.name}`,
      title: hook.name,
      type: 'hook',
      description: hook.description ?? '',
      href: `/hooks/actions#${hook.name}`,
      tags: ['action'],
    });
  }

  // WordPress hooks (filters) — same dedup by name as actions.
  const seenFilters = new Set<string>();
  for (const hook of reference.hooks.filters) {
    if (seenFilters.has(hook.name)) continue;
    seenFilters.add(hook.name);
    entries.push({
      id: `hook:filter:${hook.name}`,
      title: hook.name,
      type: 'hook',
      description: hook.description ?? '',
      href: `/hooks/filters#${hook.name}`,
      tags: ['filter'],
    });
  }

  // CSS custom properties / design tokens
  for (const token of reference.cssTokens) {
    entries.push({
      id: `css-token:${token.name}`,
      title: token.name,
      type: 'css-token',
      description: token.description ?? token.value,
      href: `/css/tokens#${token.name}`,
      tags: ['css', 'token'],
    });
  }

  // JavaScript functions
  for (const fn of reference.js.functions) {
    entries.push({
      id: `js-function:${fn.name}`,
      title: fn.name,
      type: 'js-function',
      description: fn.description ?? '',
      href: `/js/functions#${fn.name}`,
      tags: ['js', 'function'],
    });
  }

  // REST API endpoints
  for (const ep of reference.restEndpoints) {
    const slug =
      (ep.methods[0] ?? 'get').toLowerCase() +
      '-' +
      ep.route
        .replace(/^\//, '')
        .replace(/\(.*?\)/g, '') // strip regex groups like (?P<id>[\d]+)
        .replace(/\//g, '-')
        .replace(/[^a-z0-9-]/gi, '') // remove non-URL-safe chars
        .replace(/-+/g, '-') // collapse consecutive dashes
        .replace(/-$/, ''); // trim trailing dash
    entries.push({
      id: `rest:${ep.fullRoute}:${ep.methods.join(',')}`,
      title: `${ep.methods.join('/')} ${ep.route.startsWith('/') ? '' : '/'}${ep.route}`,
      type: 'rest-endpoint',
      description: ep.description || `${ep.namespace}${ep.route}`,
      href: `/rest-api/endpoints#${slug}`,
      tags: ['rest', 'api'],
    });
  }

  // REST API custom fields
  for (const field of reference.restFields ?? []) {
    entries.push({
      id: `rest-field:${field.objectType}:${field.fieldName}`,
      title: `${field.fieldName} (${field.objectType})`,
      type: 'rest-field',
      description: field.description || `Custom field on ${field.objectType}`,
      href: `/rest-api/endpoints#field-${field.objectType}-${field.fieldName}`,
      tags: ['rest', 'api', 'field', field.objectType],
    });
  }

  // Guide pages — headings and body text
  for (const guide of guides) {
    if (guide.hidden) continue;
    const parts = ['guides', guide.section];
    if (guide.subsection) parts.push(guide.subsection);
    parts.push(guide.slug);
    const href = `/${parts.join('/')}`;

    // Strip markdown syntax for plain-text body
    const body = guide.body
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_`~[\]]/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim()
      .slice(0, 500);

    entries.push({
      id: `guide:${href}`,
      title: guide.title,
      type: 'guide',
      description: guide.description ?? `${guide.section} — ${guide.title}`,
      href,
      tags: ['guide', guide.section],
      body,
    });
  }

  return {
    entries,
    generatedAt: new Date().toISOString(),
  };
}
