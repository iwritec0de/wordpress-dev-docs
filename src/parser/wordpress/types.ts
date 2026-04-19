import type { SourceLocation } from '../php/types.js';

// ─── WordPress file header types ─────────────────────────────────────────────

export interface PluginHeader {
  /** Absolute path to the file this header was extracted from */
  file: string;
  /** Plugin Name (required) */
  pluginName: string;
  pluginUri?: string;
  description?: string;
  version?: string;
  author?: string;
  authorUri?: string;
  license?: string;
  licenseUri?: string;
  textDomain?: string;
  domainPath?: string;
  /** Minimum WordPress version required (Requires at least:) */
  requiresAtLeast?: string;
  /** Minimum PHP version required (Requires PHP:) */
  requiresPhp?: string;
  /** Whether the plugin is network-wide (multisite) */
  network?: boolean;
  updateUri?: string;
}

export interface ThemeHeader {
  /** Absolute path to the file this header was extracted from */
  file: string;
  /** Theme Name (required) */
  themeName: string;
  themeUri?: string;
  description?: string;
  version?: string;
  author?: string;
  authorUri?: string;
  license?: string;
  textDomain?: string;
  /** Parent theme slug for child themes (Template:) */
  template?: string;
  /** Comma-separated theme tags */
  tags?: string[];
}

export type HookType = 'action' | 'filter';

export interface DetectedHook {
  /** Hook name (e.g. "init", "the_content", "my_plugin_settings") */
  name: string;
  /** action or filter */
  type: HookType;
  /**
   * How this hook is used:
   * - "dispatch" — do_action / apply_filters (fires the hook)
   */
  usage: 'dispatch';
  /** Description from the preceding PHPDoc block */
  description: string;
  /** @since tag from PHPDoc */
  since: string | null;
  /** Number of arguments passed at the dispatch call site */
  dispatchArgCount: number | null;
  /** @param tags from PHPDoc (name, type, description) */
  params: { name: string; type: string; description: string }[];
  location: SourceLocation;
}

export interface HookExtractResult {
  file: string;
  hooks: DetectedHook[];
}

// ─── readme.txt types ─────────────────────────────────────────────────────────

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface ChangelogEntry {
  version: string;
  /** Each bullet / line item as a string */
  notes: string[];
}

export interface ReadmeData {
  name: string;
  contributors: string[];
  donateLink?: string;
  tags: string[];
  /** Minimum WordPress version required */
  requiresAtLeast?: string;
  /** Highest WordPress version tested against */
  testedUpTo?: string;
  stableTag?: string;
  requiresPhp?: string;
  license?: string;
  licenseUri?: string;
  /** First paragraph after header key/value block (max 150 chars) */
  shortDescription: string;
  /** == Description == section content (markdown) */
  description?: string;
  /** == Installation == section content */
  installation?: string;
  faq: FaqEntry[];
  changelog: ChangelogEntry[];
  /** Screenshot descriptions (in order) */
  screenshots: string[];
  /** Any other == Section Name == sections not handled above */
  sections: Record<string, string>;
}
