import { resolve, extname, relative, dirname, sep } from 'path';
import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import { parsePhpFile } from './php/index.js';
import { parseJsFile } from './js/index.js';
import { parseCssFile } from './css/index.js';
import { parseBlockJson } from './js/block-json.js';
import { extractHooks } from './wordpress/hooks.js';
import { extractRestEndpoints, extractRestFields } from './wordpress/rest-api.js';
import { extractPluginHeader, extractThemeHeader } from './wordpress/headers.js';
import { parseReadme } from './wordpress/readme.js';
import { parseChangelogMd } from './wordpress/changelog-md.js';
import type { DocsConfig } from '../config/schema.js';
import type { ParsedBlock } from './js/block-json.js';
import type { ParseError, ParseResult } from './types.js';

// ─── File classification ──────────────────────────────────────────────────────

const JS_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const CSS_EXTENSIONS = new Set(['.css', '.scss', '.sass']);

function isPhp(file: string) {
  return extname(file) === '.php';
}
function isJs(file: string) {
  return JS_EXTENSIONS.has(extname(file));
}
function isCss(file: string) {
  return CSS_EXTENSIONS.has(extname(file));
}

// ─── Glob helpers ─────────────────────────────────────────────────────────────

async function findFiles(sourceRoot: string, excludePatterns: string[]): Promise<string[]> {
  return glob('**/*.{php,js,jsx,mjs,cjs,ts,tsx,css,scss,sass}', {
    cwd: sourceRoot,
    absolute: true,
    ignore: excludePatterns,
    nodir: true,
  });
}

async function findBlockJsonFiles(
  sourceRoot: string,
  excludePatterns: string[]
): Promise<string[]> {
  return glob('**/block.json', {
    cwd: sourceRoot,
    absolute: true,
    ignore: excludePatterns,
    nodir: true,
  });
}

/** Find the plugin's main PHP file (the one with Plugin Name: header) */
async function findPluginMainFile(sourceRoot: string): Promise<string | null> {
  const phpFiles = await glob('*.php', { cwd: sourceRoot, absolute: true, nodir: true });
  for (const file of phpFiles) {
    try {
      const header = extractPluginHeader(file);
      if (header) return file;
    } catch {
      // Not a plugin header
    }
  }
  return null;
}

/** Find the theme's style.css */
function findThemeStyleCss(sourceRoot: string): string | null {
  const path = resolve(sourceRoot, 'style.css');
  return existsSync(path) ? path : null;
}

/** Find readme.txt */
function findReadme(sourceRoot: string): string | null {
  for (const name of ['readme.txt', 'README.txt', 'Readme.txt']) {
    const path = resolve(sourceRoot, name);
    if (existsSync(path)) return path;
  }
  return null;
}

/** Find CHANGELOG.md (fallback when readme.txt has no changelog section) */
function findChangelogMd(sourceRoot: string): string | null {
  for (const name of ['CHANGELOG.md', 'changelog.md', 'Changelog.md']) {
    const path = resolve(sourceRoot, name);
    if (existsSync(path)) return path;
  }
  return null;
}

// ─── Safe parse wrappers ──────────────────────────────────────────────────────

function safeParsePhp(file: string, errors: ParseError[]) {
  try {
    return parsePhpFile(file);
  } catch (e) {
    errors.push({
      file,
      message: `PHP parse failed: ${e instanceof Error ? e.message : String(e)}`,
      error: e,
    });
    return null;
  }
}

function safeParseJs(file: string, errors: ParseError[]) {
  try {
    return parseJsFile(file);
  } catch (e) {
    errors.push({
      file,
      message: `JS parse failed: ${e instanceof Error ? e.message : String(e)}`,
      error: e,
    });
    return null;
  }
}

function safeParseCss(file: string, errors: ParseError[]) {
  try {
    return parseCssFile(file);
  } catch (e) {
    errors.push({
      file,
      message: `CSS parse failed: ${e instanceof Error ? e.message : String(e)}`,
      error: e,
    });
    return null;
  }
}

function safeExtractHooks(file: string, errors: ParseError[]) {
  try {
    return extractHooks(file);
  } catch (e) {
    errors.push({
      file,
      message: `Hook extraction failed: ${e instanceof Error ? e.message : String(e)}`,
      error: e,
    });
    return null;
  }
}

function safeExtractRestEndpoints(file: string, errors: ParseError[]) {
  try {
    return extractRestEndpoints(file);
  } catch (e) {
    errors.push({
      file,
      message: `REST endpoint extraction failed: ${e instanceof Error ? e.message : String(e)}`,
      error: e,
    });
    return null;
  }
}

function safeExtractRestFields(file: string, errors: ParseError[]) {
  try {
    return extractRestFields(file);
  } catch (e) {
    errors.push({
      file,
      message: `REST field extraction failed: ${e instanceof Error ? e.message : String(e)}`,
      error: e,
    });
    return null;
  }
}

// ─── Path normalization ──────────────────────────────────────────────────────

/**
 * Convert an absolute file path into a stable, display-friendly path rooted at
 * the source directory's basename. For sourceRoot
 * `/Users/foo/examples/example-plugin` and an absolute file at
 * `/Users/foo/examples/example-plugin/includes/class-example.php`, this returns
 * `/example-plugin/includes/class-example.php`.
 *
 * Paths outside the source root are returned unchanged.
 */
function toDisplayPath(absPath: string, sourceRoot: string): string {
  if (!absPath) return absPath;
  const rel = relative(dirname(sourceRoot), absPath);
  if (rel.startsWith('..') || rel.startsWith(sep) || rel === '') return absPath;
  return '/' + rel.split(sep).join('/');
}

/** Normalize all `file` and `location.file` fields in a ParseResult in place. */
function normalizeFilePaths(result: ParseResult, sourceRoot: string): void {
  const norm = (p: string): string => toDisplayPath(p, sourceRoot);

  for (const php of result.php) {
    php.file = norm(php.file);
    for (const fn of php.functions) fn.location.file = norm(fn.location.file);
    for (const cls of php.classes) {
      cls.location.file = norm(cls.location.file);
      for (const m of cls.methods) m.location.file = norm(m.location.file);
      for (const p of cls.properties) p.location.file = norm(p.location.file);
      for (const c of cls.constants) c.location.file = norm(c.location.file);
    }
    for (const c of php.constants) c.location.file = norm(c.location.file);
  }

  for (const js of result.js) {
    js.file = norm(js.file);
    for (const fn of js.functions) fn.location.file = norm(fn.location.file);
    for (const cls of js.classes) {
      cls.location.file = norm(cls.location.file);
      for (const m of cls.methods) m.location.file = norm(m.location.file);
    }
    if (js.wpApis) {
      for (const h of js.wpApis.hooks) h.file = norm(h.file);
      for (const d of js.wpApis.data) d.file = norm(d.file);
      for (const b of js.wpApis.blocks) b.file = norm(b.file);
    }
  }

  for (const css of result.css) {
    css.file = norm(css.file);
    for (const cp of css.customProperties) cp.location.file = norm(cp.location.file);
  }

  for (const hr of result.hooks) {
    hr.file = norm(hr.file);
    for (const h of hr.hooks) h.location.file = norm(h.location.file);
  }

  for (const ep of result.restEndpoints) ep.file = norm(ep.file);
  for (const rf of result.restFields) rf.file = norm(rf.file);
  for (const b of result.blocks) b.file = norm(b.file);

  if (result.pluginHeader) result.pluginHeader.file = norm(result.pluginHeader.file);
  if (result.themeHeader) result.themeHeader.file = norm(result.themeHeader.file);

  for (const e of result.errors) e.file = norm(e.file);
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Parse all source files in a plugin or theme directory.
 *
 * Walks the source root (respecting exclude patterns), routes each file to
 * the appropriate parser, and returns a unified {@link ParseResult}.
 */
export async function parseTarget(config: DocsConfig): Promise<ParseResult> {
  const sourceRoot = resolve(config.source);
  const errors: ParseError[] = [];
  const skippedFiles: string[] = [];

  // Find all files
  const allFiles = await findFiles(sourceRoot, config.exclude);
  const blockJsonFiles = await findBlockJsonFiles(sourceRoot, config.exclude);

  // Separate by type
  const phpFiles = allFiles.filter(isPhp);
  const jsFiles = allFiles.filter(isJs);
  const cssFiles = allFiles.filter(isCss);

  // Parse PHP files
  const phpResults = phpFiles
    .map((f) => safeParsePhp(f, errors))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Parse JS files
  const jsResults = jsFiles
    .map((f) => safeParseJs(f, errors))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Parse CSS files
  const cssResults = cssFiles
    .map((f) => safeParseCss(f, errors))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Extract hooks from all PHP files
  const hookResults = phpFiles
    .map((f) => safeExtractHooks(f, errors))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Parse block.json files
  const blockResults: ParsedBlock[] = [];
  for (const blockFile of blockJsonFiles) {
    try {
      const content = readFileSync(blockFile, 'utf8');
      const parsed = parseBlockJson(blockFile, content);
      if (parsed) blockResults.push(parsed);
    } catch (e) {
      errors.push({
        file: blockFile,
        message: `block.json parse failed: ${e instanceof Error ? e.message : String(e)}`,
        error: e,
      });
    }
  }

  // Extract REST endpoints from all PHP files
  const restEndpoints = phpFiles.flatMap((f) => safeExtractRestEndpoints(f, errors) ?? []);

  // Extract REST fields from all PHP files
  const restFields = phpFiles.flatMap((f) => safeExtractRestFields(f, errors) ?? []);

  // WordPress-specific: plugin/theme header
  let pluginHeader = null;
  let themeHeader = null;

  if (config.type === 'plugin' || config.type === 'collection') {
    const mainFile = await findPluginMainFile(sourceRoot);
    if (mainFile) {
      try {
        pluginHeader = extractPluginHeader(mainFile);
      } catch (e) {
        errors.push({ file: mainFile, message: `Plugin header extraction failed`, error: e });
      }
    }
  }

  if (config.type === 'theme') {
    const styleCss = findThemeStyleCss(sourceRoot);
    if (styleCss) {
      try {
        themeHeader = extractThemeHeader(styleCss);
      } catch (e) {
        errors.push({ file: styleCss, message: `Theme header extraction failed`, error: e });
      }
    }
  }

  // readme.txt
  let readme = null;
  const readmePath = findReadme(sourceRoot);
  if (readmePath) {
    try {
      readme = parseReadme(readmePath);
    } catch (e) {
      errors.push({ file: readmePath, message: `readme.txt parse failed`, error: e });
    }
  }

  // CHANGELOG.md fallback — if readme.txt has no changelog entries, try CHANGELOG.md
  if (!readme?.changelog?.length) {
    const changelogPath = findChangelogMd(sourceRoot);
    if (changelogPath) {
      try {
        const changelogEntries = parseChangelogMd(changelogPath);
        if (changelogEntries.length > 0) {
          if (readme) {
            readme.changelog = changelogEntries;
          } else {
            // Create a minimal ReadmeData with just the changelog
            readme = {
              name: '',
              contributors: [],
              tags: [],
              shortDescription: '',
              faq: [],
              changelog: changelogEntries,
              screenshots: [],
              sections: {},
            };
          }
        }
      } catch (e) {
        errors.push({ file: changelogPath, message: `CHANGELOG.md parse failed`, error: e });
      }
    }
  }

  const result: ParseResult = {
    sourceRoot,
    config,
    php: phpResults,
    js: jsResults,
    css: cssResults,
    hooks: hookResults,
    blocks: blockResults,
    restEndpoints,
    restFields,
    pluginHeader,
    themeHeader,
    readme,
    skippedFiles,
    errors,
  };

  // Rewrite all stored file paths to a stable, display-friendly form
  // (e.g. `/example-plugin/includes/class-example.php`) so generated
  // documentation never leaks the absolute path of the host machine.
  normalizeFilePaths(result, sourceRoot);

  return result;
}

// Re-export types
export type * from './types.js';
