import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const guidesRoot = resolve(__dir, '../../../examples/example-plugin/guides');

/**
 * Smoke tests for the example-plugin guides fixture (T-064).
 *
 * These assertions exist so that structural changes to the fixture are
 * caught by CI even before the full parser/generator integration lands
 * in T-058/T-059. The parser itself is exercised by
 * `guides.test.ts`.
 */
describe('example-plugin guides fixture', () => {
  it('exists as a directory', () => {
    expect(existsSync(guidesRoot)).toBe(true);
    expect(statSync(guidesRoot).isDirectory()).toBe(true);
  });

  const expectedFiles = [
    '01-intro/01-welcome.mdx',
    '01-intro/02-concepts.md',
    '02-quickstart/installing.md',
    '02-quickstart/first-block.mdx',
    '03-advanced/hooks/custom-filters.md',
  ];

  it.each(expectedFiles)('contains %s', (rel) => {
    const full = resolve(guidesRoot, rel);
    expect(existsSync(full)).toBe(true);
    const stat = statSync(full);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('01-welcome.mdx has frontmatter with title', () => {
    const body = readFileSync(resolve(guidesRoot, '01-intro/01-welcome.mdx'), 'utf8');
    expect(body.startsWith('---')).toBe(true);
    expect(body).toMatch(/title:\s*Welcome/);
  });

  it('installing.md relies on a heading for its title (no frontmatter)', () => {
    const body = readFileSync(resolve(guidesRoot, '02-quickstart/installing.md'), 'utf8');
    expect(body.startsWith('---')).toBe(false);
    expect(body).toMatch(/^#\s+Installing/m);
  });

  it('first-block.mdx uses an MDX component', () => {
    const body = readFileSync(resolve(guidesRoot, '02-quickstart/first-block.mdx'), 'utf8');
    expect(body).toMatch(/<Callout/);
  });

  it('includes at least one relative image and one internal link', () => {
    const concepts = readFileSync(resolve(guidesRoot, '01-intro/02-concepts.md'), 'utf8');
    expect(concepts).toMatch(/!\[[^\]]*\]\(\.\//);

    const welcome = readFileSync(resolve(guidesRoot, '01-intro/01-welcome.mdx'), 'utf8');
    expect(welcome).toMatch(/\]\(\/guides\//);
  });
});
