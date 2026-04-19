import { readFileSync } from 'fs';
import type { PluginHeader, ThemeHeader } from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Matches the first block comment in a file (either a docblock or a plain block comment).
 * Uses [\s\S] to cross line boundaries and is non-greedy to stop at the first closing delimiter.
 * Handles both CRLF and LF line endings.
 */
const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//;

// Matches a "Field Name: value" line inside a comment block.
// - Allows optional leading "*" (as in docblock lines)
// - Field name: one or more words separated by spaces
// - Value: everything after ": " up to end of line (trimmed)
const HEADER_FIELD_RE = /^[*\s]*([A-Za-z][A-Za-z\s]*):\s*(.+?)\s*$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the first block comment from file content and return a map of
 * lowercased field names to their values.
 */
function parseHeaderFields(content: string): Map<string, string> {
  const match = BLOCK_COMMENT_RE.exec(content);
  if (!match) return new Map();

  const block = match[0];
  const fields = new Map<string, string>();

  for (const line of block.split(/\r?\n/)) {
    const m = HEADER_FIELD_RE.exec(line);
    if (m) {
      const key = m[1]!.trim().toLowerCase();
      const value = m[2]!.trim();
      if (value) {
        fields.set(key, value);
      }
    }
  }

  return fields;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract WordPress plugin header metadata from a PHP file.
 *
 * Looks for the first block comment and parses "Field Name: value" pairs.
 * Returns null if "Plugin Name" is absent.
 *
 * @param file - Absolute path to the plugin's main PHP file.
 */
export function extractPluginHeader(file: string): PluginHeader | null {
  const content = readFileSync(file, 'utf8');
  const fields = parseHeaderFields(content);

  const pluginName = fields.get('plugin name');
  if (!pluginName) return null;

  const networkRaw = fields.get('network');
  const network =
    networkRaw !== undefined
      ? networkRaw.toLowerCase() === 'true' || networkRaw === '1'
      : undefined;

  const header: PluginHeader = { file, pluginName };

  if (fields.has('plugin uri')) header.pluginUri = fields.get('plugin uri');
  if (fields.has('description')) header.description = fields.get('description');
  if (fields.has('version')) header.version = fields.get('version');
  if (fields.has('author')) header.author = fields.get('author');
  if (fields.has('author uri')) header.authorUri = fields.get('author uri');
  if (fields.has('license')) header.license = fields.get('license');
  if (fields.has('license uri')) header.licenseUri = fields.get('license uri');
  if (fields.has('text domain')) header.textDomain = fields.get('text domain');
  if (fields.has('domain path')) header.domainPath = fields.get('domain path');
  if (fields.has('requires at least')) header.requiresAtLeast = fields.get('requires at least');
  if (fields.has('requires php')) header.requiresPhp = fields.get('requires php');
  if (network !== undefined) header.network = network;
  if (fields.has('update uri')) header.updateUri = fields.get('update uri');

  return header;
}

/**
 * Extract WordPress theme header metadata from a CSS stylesheet (style.css).
 *
 * Looks for the first block comment and parses "Field Name: value" pairs.
 * Returns null if "Theme Name" is absent.
 *
 * @param file - Absolute path to the theme's style.css file.
 */
export function extractThemeHeader(file: string): ThemeHeader | null {
  const content = readFileSync(file, 'utf8');
  const fields = parseHeaderFields(content);

  const themeName = fields.get('theme name');
  if (!themeName) return null;

  const header: ThemeHeader = { file, themeName };

  if (fields.has('theme uri')) header.themeUri = fields.get('theme uri');
  if (fields.has('description')) header.description = fields.get('description');
  if (fields.has('version')) header.version = fields.get('version');
  if (fields.has('author')) header.author = fields.get('author');
  if (fields.has('author uri')) header.authorUri = fields.get('author uri');
  if (fields.has('license')) header.license = fields.get('license');
  if (fields.has('text domain')) header.textDomain = fields.get('text domain');
  if (fields.has('template')) header.template = fields.get('template');

  const tagsRaw = fields.get('tags');
  if (tagsRaw) {
    header.tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return header;
}

export type * from './types.js';
