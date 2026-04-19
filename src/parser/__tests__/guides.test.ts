import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parseGuides } from '../guides/index.js';

let root: string;

function write(rel: string, content: string) {
  const full = join(root, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content, 'utf8');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'wpdocs-guides-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('parseGuides', () => {
  it('returns [] for missing folder', async () => {
    const result = await parseGuides(join(root, 'nonexistent'));
    expect(result).toEqual([]);
  });

  it('returns [] for empty folder', async () => {
    const result = await parseGuides(root);
    expect(result).toEqual([]);
  });

  it('parses basic section + file structure', async () => {
    write('intro/welcome.md', '# Welcome\n\nBody here.');
    const guides = await parseGuides(root);
    expect(guides).toHaveLength(1);
    expect(guides[0]).toMatchObject({
      section: 'intro',
      slug: 'welcome',
      title: 'Welcome',
      hidden: false,
    });
    expect(guides[0]!.body).toContain('Body here.');
  });

  it('prefers frontmatter title over heading over filename', async () => {
    write('a/fm.md', '---\ntitle: From Frontmatter\n---\n# Heading Title\n');
    write('a/heading.md', '# Heading Title\n');
    write('a/from-file-name.md', 'no frontmatter, no heading');
    const guides = await parseGuides(root);
    const byTitle = Object.fromEntries(guides.map((g) => [g.slug, g.title]));
    expect(byTitle.fm).toBe('From Frontmatter');
    expect(byTitle.heading).toBe('Heading Title');
    expect(byTitle['from-file-name']).toBe('From File Name');
  });

  it('orders by frontmatter order, then numeric filename prefix, then title', async () => {
    write('s/02-second.md', '---\ntitle: Second\n---\n');
    write('s/01-first.md', '---\ntitle: First\n---\n');
    write('s/explicit.md', '---\ntitle: Zero\norder: 0\n---\n');
    const guides = await parseGuides(root);
    expect(guides.map((g) => g.title)).toEqual(['Zero', 'First', 'Second']);
    // Numeric prefix is stripped from slug
    expect(guides.map((g) => g.slug)).toEqual(['explicit', 'first', 'second']);
  });

  it('supports one level of nested subsections', async () => {
    write('advanced/hooks/custom-filters.md', '# Custom Filters\n');
    const guides = await parseGuides(root);
    expect(guides).toHaveLength(1);
    expect(guides[0]).toMatchObject({
      section: 'advanced',
      subsection: 'hooks',
      slug: 'custom-filters',
      title: 'Custom Filters',
    });
  });

  it('respects hidden flag and section override in frontmatter', async () => {
    write('a/page.md', '---\nhidden: true\nsection: custom\n---\n# Page\n');
    const guides = await parseGuides(root);
    expect(guides).toHaveLength(1);
    expect(guides[0]!.hidden).toBe(true);
    expect(guides[0]!.section).toBe('custom');
  });

  it('throws on invalid frontmatter', async () => {
    write('a/bad.md', '---\norder: "not a number"\n---\n# Bad\n');
    await expect(parseGuides(root)).rejects.toThrow(/Invalid frontmatter/);
  });
});
