import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Guide } from '../../../parser/guides/types.js';
import { buildGuideSections, writeGuidePages } from '../guides.js';

function makeGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    section: 'intro',
    slug: 'welcome',
    title: 'Welcome',
    order: 1,
    body: '\n# Welcome\n\nHello world.\n',
    sourcePath: '/fake/guides/intro/welcome.md',
    hidden: false,
    ...overrides,
  };
}

describe('buildGuideSections', () => {
  it('returns empty array for no guides', () => {
    expect(buildGuideSections([])).toEqual([]);
  });

  it('groups guides by section', () => {
    const guides = [
      makeGuide({ section: 'intro', slug: 'welcome', title: 'Welcome', order: 1 }),
      makeGuide({ section: 'intro', slug: 'concepts', title: 'Concepts', order: 2 }),
      makeGuide({ section: 'quickstart', slug: 'install', title: 'Install', order: 1 }),
    ];
    const sections = buildGuideSections(guides);
    expect(sections).toHaveLength(2);
    expect(sections[0]!.title).toBe('Intro');
    expect(sections[0]!.slug).toBe('guides/intro');
    expect(sections[0]!.items).toHaveLength(2);
    expect(sections[1]!.title).toBe('Quickstart');
    expect(sections[1]!.items).toHaveLength(1);
  });

  it('handles subsections', () => {
    const guides = [
      makeGuide({ section: 'advanced', subsection: 'hooks', slug: 'filters', title: 'Filters' }),
    ];
    const sections = buildGuideSections(guides);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.items).toHaveLength(0);
    expect(sections[0]!.subsections).toHaveLength(1);
    expect(sections[0]!.subsections![0]!.title).toBe('Hooks');
    expect(sections[0]!.subsections![0]!.slug).toBe('guides/advanced/hooks');
    expect(sections[0]!.subsections![0]!.items[0]!.slug).toBe('guides/advanced/hooks/filters');
  });

  it('excludes hidden guides from nav', () => {
    const guides = [
      makeGuide({ hidden: true }),
      makeGuide({ section: 'intro', slug: 'visible', title: 'Visible' }),
    ];
    const sections = buildGuideSections(guides);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.items).toHaveLength(1);
    expect(sections[0]!.items[0]!.title).toBe('Visible');
  });
});

describe('writeGuidePages', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'guides-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes content.mdx and page.tsx for each guide', () => {
    const guides = [makeGuide({ section: 'intro', slug: 'welcome', title: 'Welcome' })];
    const written = writeGuidePages(guides, tmpDir);
    expect(written).toHaveLength(2); // content.mdx + page.tsx

    const mdxPath = join(tmpDir, 'app/guides/intro/welcome/content.mdx');
    const tsxPath = join(tmpDir, 'app/guides/intro/welcome/page.tsx');
    expect(existsSync(mdxPath)).toBe(true);
    expect(existsSync(tsxPath)).toBe(true);

    const mdx = readFileSync(mdxPath, 'utf8');
    expect(mdx).toContain('Hello world.');

    const tsx = readFileSync(tsxPath, 'utf8');
    expect(tsx).toContain('export const metadata');
    expect(tsx).toContain('"Welcome"');
    expect(tsx).toContain("import Content from './content.mdx'");
  });

  it('writes subsection guides to correct path', () => {
    const guides = [makeGuide({ section: 'advanced', subsection: 'hooks', slug: 'filters' })];
    const written = writeGuidePages(guides, tmpDir);
    expect(existsSync(join(tmpDir, 'app/guides/advanced/hooks/filters/page.tsx'))).toBe(true);
    expect(existsSync(join(tmpDir, 'app/guides/advanced/hooks/filters/content.mdx'))).toBe(true);
    expect(written).toHaveLength(2);
  });

  it('includes description in metadata when present', () => {
    const guides = [makeGuide({ description: 'A welcome guide' })];
    writeGuidePages(guides, tmpDir);
    const tsx = readFileSync(join(tmpDir, 'app/guides/intro/welcome/page.tsx'), 'utf8');
    expect(tsx).toContain('"A welcome guide"');
  });

  it('writes hidden guides to disk', () => {
    const guides = [makeGuide({ hidden: true })];
    const written = writeGuidePages(guides, tmpDir);
    expect(written).toHaveLength(2);
    expect(existsSync(join(tmpDir, 'app/guides/intro/welcome/page.tsx'))).toBe(true);
  });
});
