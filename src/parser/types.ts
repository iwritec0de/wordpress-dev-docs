import type { PhpParseResult } from './php/types.js';
import type { JsParseResult } from './js/types.js';
import type { CssParseResult } from './css/types.js';
import type {
  HookExtractResult,
  PluginHeader,
  ThemeHeader,
  ReadmeData,
} from './wordpress/types.js';
import type { ParsedBlock } from './js/block-json.js';
import type { RestEndpoint, RestField } from './wordpress/rest-api.js';
import type { DocsConfig } from '../config/schema.js';

export type {
  PhpParseResult,
  JsParseResult,
  CssParseResult,
  HookExtractResult,
  PluginHeader,
  ThemeHeader,
  ReadmeData,
  ParsedBlock,
  RestEndpoint,
  RestField,
};

/** File extension categories */
export type FileCategory = 'php' | 'js' | 'css' | 'other';

/** Summary of all files found in the target */
export interface ParsedFileSet {
  php: string[];
  js: string[];
  css: string[];
}

/** Full parse result for a single plugin or theme target */
export interface ParseResult {
  /** Absolute path to the source root that was parsed */
  sourceRoot: string;
  /** The config used for this parse */
  config: DocsConfig;
  /** PHP parse results, one per file */
  php: PhpParseResult[];
  /** JS parse results, one per file */
  js: JsParseResult[];
  /** CSS parse results, one per file */
  css: CssParseResult[];
  /** All detected WordPress hooks (actions + filters), aggregated across all PHP files */
  hooks: HookExtractResult[];
  /** All detected REST API endpoints registered via register_rest_route() */
  restEndpoints: RestEndpoint[];
  /** All detected REST API custom fields registered via register_rest_field() */
  restFields: RestField[];
  /** Plugin file header (null if not found or type is theme) */
  pluginHeader: PluginHeader | null;
  /** Theme file header (null if not found or type is plugin) */
  themeHeader: ThemeHeader | null;
  /** Parsed readme.txt (null if not found) */
  readme: ReadmeData | null;
  /** Files that were found but skipped (matched exclude patterns) */
  skippedFiles: string[];
  /** Gutenberg block registrations parsed from block.json files */
  blocks: ParsedBlock[];
  /** Any non-fatal parse errors encountered */
  errors: ParseError[];
}

export interface ParseError {
  file: string;
  message: string;
  error?: unknown;
}
