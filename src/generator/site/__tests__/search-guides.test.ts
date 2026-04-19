import { describe, it, expect } from 'vitest';
import { buildSearchIndex } from '../search.js';
import type { McpReference } from '../../mcp/types.js';
import type { Guide } from '../../../parser/guides/types.js';

function emptyRef(): McpReference {
  return {
    name: 'test',
    version: '1.0',
    description: '',
    functions: [],
    classes: [],
    constants: [],
    hooks: { actions: [], filters: [] },
    cssTokens: [],
    js: { functions: [] },
    restEndpoints: [],
    restFields: [],
  } as McpReference;
}

function makeGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    section: 'intro',
    slug: 'welcome',
    title: 'Welcome',
    order: 1,
    body: '# Welcome\n\nThis is a guide about getting started.',
    sourcePath: '/guides/intro/welcome.md',
    hidden: false,
    ...overrides,
  };
}

describe('buildSearchIndex with guides', () => {
  it('includes guide entries in the search index', () => {
    const guides = [makeGuide()];
    const index = buildSearchIndex(emptyRef(), [], guides);
    const guideEntries = index.entries.filter((e) => e.type === 'guide');
    expect(guideEntries).toHaveLength(1);
    expect(guideEntries[0]!.title).toBe('Welcome');
    expect(guideEntries[0]!.href).toBe('/guides/intro/welcome');
    expect(guideEntries[0]!.body).toBeTruthy();
  });

  it('excludes hidden guides from search index', () => {
    const guides = [makeGuide({ hidden: true })];
    const index = buildSearchIndex(emptyRef(), [], guides);
    const guideEntries = index.entries.filter((e) => e.type === 'guide');
    expect(guideEntries).toHaveLength(0);
  });

  it('includes subsection in guide href', () => {
    const guides = [makeGuide({ subsection: 'hooks', slug: 'custom' })];
    const index = buildSearchIndex(emptyRef(), [], guides);
    const entry = index.entries.find((e) => e.type === 'guide');
    expect(entry!.href).toBe('/guides/intro/hooks/custom');
  });

  it('strips markdown from body text', () => {
    const guides = [makeGuide({ body: '## Heading\n\n**Bold** and `code` text.' })];
    const index = buildSearchIndex(emptyRef(), [], guides);
    const entry = index.entries.find((e) => e.type === 'guide');
    expect(entry!.body).not.toContain('##');
    expect(entry!.body).not.toContain('**');
    expect(entry!.body).not.toContain('`');
  });
});
