import { readdirSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { parseTarget } from './index.js';
import type { ParseResult } from './types.js';
import type { DocsConfig } from '../config/schema.js';
import { resolveConfig } from '../config/loader.js';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CollectionMember {
  /** Plugin/theme name (from plugin header or directory name) */
  name: string;
  /** Kebab-case directory name */
  slug: string;
  /** Absolute path to this plugin's directory */
  directory: string;
  /** Full parse result for this member */
  parseResult: ParseResult;
}

export interface CollectionGroup {
  name: string;
  slugs: string[];
}

export interface CollectionResult {
  members: CollectionMember[];
  /** Groups derived from config.groups (empty array if no groups configured) */
  groups: CollectionGroup[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a directory name to a kebab-case slug */
function toSlug(dirName: string): string {
  return dirName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Get immediate subdirectories of rootDir */
function getSubdirectories(rootDir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(rootDir);
  } catch {
    return [];
  }

  return entries
    .map((entry) => resolve(rootDir, entry))
    .filter((fullPath) => {
      try {
        return statSync(fullPath).isDirectory();
      } catch {
        return false;
      }
    });
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Parse a collection of plugins/themes from a root directory.
 *
 * Scans `rootDir` for immediate subdirectories, treats each as a plugin,
 * parses it using {@link parseTarget}, and returns a {@link CollectionResult}
 * with all members grouped according to `config.groups`.
 */
export async function parseCollection(
  rootDir: string,
  config: DocsConfig
): Promise<CollectionResult> {
  const absoluteRoot = resolve(rootDir);
  const subdirs = getSubdirectories(absoluteRoot);

  // Parse each subdirectory as an individual plugin
  const members: CollectionMember[] = await Promise.all(
    subdirs.map(async (subdir): Promise<CollectionMember> => {
      const slug = toSlug(basename(subdir));

      // Build a per-member config: override source + type to 'plugin'
      const memberConfig = resolveConfig({
        ...config,
        type: 'plugin',
        source: subdir,
      });

      const parseResult = await parseTarget(memberConfig);

      // Prefer the plugin header name, fall back to directory name
      const name =
        parseResult.pluginHeader?.pluginName ??
        parseResult.themeHeader?.themeName ??
        basename(subdir);

      return { name, slug, directory: subdir, parseResult };
    })
  );

  // Build groups from config, mapping plugin slug names
  const groups: CollectionGroup[] = config.groups.map((g) => ({
    name: g.name,
    slugs: g.plugins.map(toSlug),
  }));

  return { members, groups };
}
