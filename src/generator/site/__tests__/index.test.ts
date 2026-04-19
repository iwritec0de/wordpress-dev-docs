import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { scaffoldSite } from '../index.js';
import { buildMcpReference } from '../../mcp/index.js';
import { parseTarget } from '../../../parser/index.js';
import { resolveConfig } from '../../../config/loader.js';
import type { ScaffoldResult } from '../types.js';
import type { McpReference } from '../../mcp/types.js';
import { tmpdir } from 'os';
import { mkdtempSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const examplePlugin = resolve(__dir, '../../../../examples/example-plugin');

let result: ScaffoldResult;
let ref: McpReference;
let outputDir: string;

beforeAll(async () => {
  outputDir = mkdtempSync(resolve(tmpdir(), 'wpdocs-site-test-'));
  const config = resolveConfig({
    name: 'Example Plugin',
    type: 'plugin',
    source: examplePlugin,
    site: { title: 'Example Plugin Docs', description: 'Test docs' },
  });
  const parsed = await parseTarget(config);
  ref = buildMcpReference(parsed);
  result = scaffoldSite({ config, reference: ref, outputDir });
});

describe('scaffoldSite — output structure', () => {
  it('returns outputDir', () => {
    expect(result.outputDir).toBe(outputDir);
  });

  it('writes files to disk', () => {
    expect(result.filesWritten.length).toBeGreaterThan(0);
    for (const f of result.filesWritten) {
      expect(existsSync(f), `File not found: ${f}`).toBe(true);
    }
  });

  it('writes package.json', () => {
    expect(existsSync(resolve(outputDir, 'package.json'))).toBe(true);
  });

  it('writes tsconfig.json', () => {
    expect(existsSync(resolve(outputDir, 'tsconfig.json'))).toBe(true);
  });

  it('writes next.config.mjs', () => {
    expect(existsSync(resolve(outputDir, 'next.config.mjs'))).toBe(true);
  });

  it('writes app/layout.tsx', () => {
    expect(existsSync(resolve(outputDir, 'app/layout.tsx'))).toBe(true);
  });

  it('writes app/globals.css', () => {
    expect(existsSync(resolve(outputDir, 'app/globals.css'))).toBe(true);
  });

  it('writes app/page.tsx (overview)', () => {
    expect(existsSync(resolve(outputDir, 'app/page.tsx'))).toBe(true);
  });

  it('writes components/Sidebar.tsx', () => {
    expect(existsSync(resolve(outputDir, 'components/Sidebar.tsx'))).toBe(true);
  });

  it('writes public/data/site-data.json', () => {
    expect(existsSync(result.dataFile)).toBe(true);
  });
});

describe('scaffoldSite — conditional pages', () => {
  it('writes PHP functions page when functions exist', () => {
    if (ref.functions.length > 0) {
      expect(existsSync(resolve(outputDir, 'app/php/functions/page.tsx'))).toBe(true);
    }
  });

  it('writes PHP classes page when classes exist', () => {
    if (ref.classes.length > 0) {
      expect(existsSync(resolve(outputDir, 'app/php/classes/page.tsx'))).toBe(true);
    }
  });

  it('writes hooks/actions page when actions exist', () => {
    if (ref.hooks.actions.length > 0) {
      expect(existsSync(resolve(outputDir, 'app/hooks/actions/page.tsx'))).toBe(true);
    }
  });

  it('writes hooks/filters page when filters exist', () => {
    if (ref.hooks.filters.length > 0) {
      expect(existsSync(resolve(outputDir, 'app/hooks/filters/page.tsx'))).toBe(true);
    }
  });

  it('writes CSS tokens page when tokens exist', () => {
    if (ref.cssTokens.length > 0) {
      expect(existsSync(resolve(outputDir, 'app/css/tokens/page.tsx'))).toBe(true);
    }
  });

  it('always writes changelog page', () => {
    expect(existsSync(resolve(outputDir, 'app/changelog/page.tsx'))).toBe(true);
  });
});

describe('scaffoldSite — site-data.json content', () => {
  let siteData: ReturnType<JSON['parse']>;

  beforeAll(() => {
    siteData = JSON.parse(readFileSync(result.dataFile, 'utf8'));
  });

  it('has meta.title', () => {
    expect(siteData.meta.title).toBeTruthy();
  });

  it('has meta.generatedAt', () => {
    expect(siteData.meta.generatedAt).toBeTruthy();
  });

  it('contains reference data', () => {
    expect(siteData.reference.functions).toBeDefined();
    expect(siteData.reference.hooks).toBeDefined();
    expect(siteData.reference.cssTokens).toBeDefined();
  });

  it('contains nav sections', () => {
    expect(Array.isArray(siteData.nav)).toBe(true);
    expect(siteData.nav.length).toBeGreaterThan(0);
  });

  it('nav overview section always present', () => {
    const overview = siteData.nav.find((s: { slug: string }) => s.slug === 'overview');
    expect(overview).toBeDefined();
  });
});

describe('scaffoldSite — package.json content', () => {
  it('package.json has next dependency', () => {
    const pkg = JSON.parse(readFileSync(resolve(outputDir, 'package.json'), 'utf8'));
    expect(pkg.dependencies.next).toBeTruthy();
  });

  it('package.json has build script', () => {
    const pkg = JSON.parse(readFileSync(resolve(outputDir, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toBe('next build');
  });
});

describe('scaffoldSite — next.config.mjs content', () => {
  it('next.config.mjs sets output: export', () => {
    const content = readFileSync(resolve(outputDir, 'next.config.mjs'), 'utf8');
    expect(content).toContain("output: 'export'");
  });
});

describe('scaffoldSite — skin/token system', () => {
  it('writes app/tokens.css with :root block', () => {
    const css = readFileSync(resolve(outputDir, 'app/tokens.css'), 'utf8');
    expect(css).toContain(':root');
    expect(css).toContain('--color-bg');
    expect(css).toContain('--color-accent');
  });

  it('tokens.css with "wordpress" skin has different accent than default', () => {
    const wpDir = mkdtempSync(resolve(tmpdir(), 'wpdocs-wp-'));
    const wpConfig = resolveConfig({
      name: 'Example Plugin',
      type: 'plugin',
      source: examplePlugin,
      skin: 'wordpress',
      site: { title: 'WP Docs', description: '' },
    });
    scaffoldSite({ config: wpConfig, reference: ref, outputDir: wpDir });
    const wpCss = readFileSync(resolve(wpDir, 'app/tokens.css'), 'utf8');
    const defaultCss = readFileSync(resolve(outputDir, 'app/tokens.css'), 'utf8');
    expect(wpCss).not.toBe(defaultCss);
    // WP accent is #2271b1, default is #2563eb
    expect(wpCss).toContain('#2271b1');
    expect(defaultCss).toContain('#2563eb');
  });

  it('unknown skin falls back to default skin', () => {
    const fallbackDir = mkdtempSync(resolve(tmpdir(), 'wpdocs-fallback-'));
    const fallbackConfig = resolveConfig({
      name: 'Example Plugin',
      type: 'plugin',
      source: examplePlugin,
      theme: 'totally-unknown-theme',
      site: { title: 'Fallback Docs', description: '' },
    });
    scaffoldSite({ config: fallbackConfig, reference: ref, outputDir: fallbackDir });
    const fallbackCss = readFileSync(resolve(fallbackDir, 'app/tokens.css'), 'utf8');
    expect(fallbackCss).toContain(':root');
    expect(fallbackCss).toContain('Skin: Default');
  });

  it('globals.css imports tailwindcss and tokens.css', () => {
    const css = readFileSync(resolve(outputDir, 'app/globals.css'), 'utf8');
    expect(css).toContain('tailwindcss');
    expect(css).toContain('./tokens.css');
  });
});

describe('scaffoldSite — search-index.json', () => {
  let searchIndex: ReturnType<JSON['parse']>;

  beforeAll(() => {
    const searchIndexPath = resolve(outputDir, 'public/data/search-index.json');
    searchIndex = JSON.parse(readFileSync(searchIndexPath, 'utf8'));
  });

  it('writes public/data/search-index.json', () => {
    expect(existsSync(resolve(outputDir, 'public/data/search-index.json'))).toBe(true);
  });

  it('search-index.json has entries array', () => {
    expect(Array.isArray(searchIndex.entries)).toBe(true);
    expect(searchIndex.entries.length).toBeGreaterThan(0);
  });

  it('search-index.json has generatedAt timestamp', () => {
    expect(searchIndex.generatedAt).toBeTruthy();
  });
});
