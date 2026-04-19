import type { McpReference } from '../mcp/types.js';
import type { DocsConfig } from '../../config/schema.js';
import type { Guide } from '../../parser/guides/types.js';
import type { ChangelogEntry } from '../../parser/wordpress/types.js';

/** The data file written into the Next.js site's public/data/ directory */
export interface SiteData {
  schemaVersion: number;
  /** Site metadata derived from config + plugin/theme header */
  meta: SiteMeta;
  /** The full MCP reference — used as the data source for all doc pages */
  reference: McpReference;
  /** Navigation structure */
  nav: NavSection[];
  /** Changelog entries from readme.txt or CHANGELOG.md */
  changelog: ChangelogEntry[];
}

export interface SiteMeta {
  title: string;
  description: string;
  version: string | null;
  baseUrl: string;
  logo: string | null;
  githubUrl: string | null;
  navLinks: { label: string; href: string }[] | null;
  generatedAt: string;
}

export interface NavSection {
  title: string;
  slug: string;
  icon?: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: string;
  badge?: string;
}

export interface SearchEntry {
  id: string;
  title: string;
  type:
    | 'function'
    | 'class'
    | 'hook'
    | 'constant'
    | 'css-token'
    | 'page'
    | 'guide'
    | 'js-function'
    | 'rest-endpoint'
    | 'rest-field';
  description: string;
  href: string;
  tags?: string[];
  /** Optional body text for full-text search (e.g. guide content). */
  body?: string;
}

export interface SearchIndex {
  entries: SearchEntry[];
  generatedAt: string;
}

/** Options for the site scaffolder */
export interface ScaffoldOptions {
  config: DocsConfig;
  reference: McpReference;
  /** Absolute path to the output directory */
  outputDir: string;
  /** Whether to overwrite an existing site (default: true) */
  overwrite?: boolean;
  /**
   * Directory containing `docs.config.json` — used to resolve relative custom
   * theme paths (e.g. `"./my-theme"`).  Defaults to `process.cwd()` when not
   * provided.
   */
  configDir?: string;
  /** Parsed guide objects to write as MDX pages (F2 mdx-guides). */
  guides?: Guide[];
  /** Changelog entries from readme.txt or CHANGELOG.md */
  changelog?: ChangelogEntry[];
}

/** Result of a scaffold operation */
export interface ScaffoldResult {
  outputDir: string;
  filesWritten: string[];
  dataFile: string;
  /** Warnings from override merging or other non-fatal issues. */
  warnings: string[];
}
