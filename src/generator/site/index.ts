import { writeFileSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { buildNav } from './nav.js';
import { resolveSkinFromConfig, generateTokensCss } from './tokens.js';
import { buildSearchIndex } from './search.js';
import { buildGuideSections, writeGuidePages } from './guides.js';
import { loadOverrides, mergeOverrides } from '../../overrides/index.js';
import { packageRootFrom } from '../../lib/package-root.js';
import type { ScaffoldOptions, ScaffoldResult, SiteMeta } from './types.js';

// ─── Template directory ──────────────────────────────────────────────────────

const TEMPLATE_DIR = join(
  packageRootFrom(import.meta.url),
  'packages',
  'site-template',
  'template'
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function writeFile(filesWritten: string[], filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
  filesWritten.push(filePath);
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

// ─── Main scaffolder ─────────────────────────────────────────────────────────

/**
 * Scaffold a complete Next.js documentation site into the output directory.
 *
 * Copy-based approach (F3):
 *   1. Copy `packages/site-template/template/` → output dir
 *   2. Write `public/data/site-data.json` (reference data + nav)
 *   3. Write `public/data/search-index.json`
 *   4. Write `app/tokens.css` (resolved skin + token overrides)
 *   5. Copy guide MDX files into the site (F2)
 *
 * The template contains all .tsx page components, layout, globals.css,
 * package.json, next.config, etc. — no string generation needed.
 */
export function scaffoldSite(options: ScaffoldOptions): ScaffoldResult {
  const {
    config,
    reference,
    outputDir,
    configDir = process.cwd(),
    guides = [],
    changelog = [],
  } = options;
  const filesWritten: string[] = [];
  const out = (path: string) => join(outputDir, path);
  const w = (path: string, content: string) => writeFile(filesWritten, out(path), content);

  // Step 1: Copy the template directory into the output
  cpSync(TEMPLATE_DIR, outputDir, { recursive: true });

  // Step 2: Build site metadata + nav + search index
  const meta: SiteMeta = {
    title: config.site.title ?? reference.name,
    description: config.site.description ?? reference.description ?? '',
    version: reference.version,
    baseUrl: config.site.baseUrl,
    logo: config.site.logo ?? null,
    githubUrl: config.site.githubUrl ?? null,
    navLinks: config.site.navLinks ?? null,
    generatedAt: new Date().toISOString(),
  };

  // Step 2b: Load + merge reference overrides (F8)
  const overrideWarnings: string[] = [];
  const overrides = loadOverrides(configDir, config.overrides);
  if (overrides) {
    overrideWarnings.push(...mergeOverrides(reference, overrides));
  }

  const guideSections = buildGuideSections(guides);
  const nav = buildNav(reference, guideSections);
  const searchIndex = buildSearchIndex(reference, nav, guides);
  const siteData = { schemaVersion: 1, meta, reference, nav, changelog };

  // Step 3: Write data files (overwrites the fixture from the template)
  const dataFile = out('public/data/site-data.json');
  w('public/data/site-data.json', json(siteData));
  w('public/data/search-index.json', json(searchIndex));

  // Step 4: Resolve skin + token overrides → tokens.css
  const skin = resolveSkinFromConfig({
    skin: config.skin,
    tokens: config.tokens,
    theme: config.theme,
    configDir,
  });
  w('app/tokens.css', generateTokensCss(skin));

  // Step 5: Write guide MDX pages (F2)
  if (guides.length > 0) {
    const guideFiles = writeGuidePages(guides, outputDir);
    filesWritten.push(...guideFiles);
  }

  return { outputDir, filesWritten, dataFile, warnings: overrideWarnings };
}

export type * from './types.js';
