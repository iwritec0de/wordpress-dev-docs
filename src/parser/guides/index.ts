import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import matter from 'gray-matter';
import { parseFrontmatter } from './frontmatter.js';
import type { Guide } from './types.js';

const GUIDE_EXTENSIONS = new Set(['.md', '.mdx']);

/** Parse a numeric prefix like `01-foo` or `10_bar` → { order, rest }. */
function splitNumericPrefix(name: string): { order?: number; rest: string } {
  const match = name.match(/^(\d+)[-_](.+)$/);
  if (!match) return { rest: name };
  return { order: Number(match[1]), rest: match[2]! };
}

/** Convert kebab/snake case to Title Case. */
function toTitleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Extract the first `# heading` from a markdown body, if any. */
function firstHeading(body: string): string | undefined {
  const match = body.match(/^#\s+(.+?)\s*$/m);
  return match?.[1]?.trim();
}

/** List subdirectories of `dir` (non-recursive). */
function listDirs(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.') && !name.startsWith('_'))
    .filter((name) => {
      try {
        return statSync(join(dir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

/** List guide files (`.md`/`.mdx`) in `dir` (non-recursive). */
function listGuideFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.') && !name.startsWith('_'))
    .filter((name) => {
      try {
        return statSync(join(dir, name)).isFile() && GUIDE_EXTENSIONS.has(extname(name));
      } catch {
        return false;
      }
    })
    .sort();
}

/** Parse a single guide file into a {@link Guide}. */
function parseGuideFile(filePath: string, section: string, subsection: string | undefined): Guide {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const fm = parseFrontmatter(parsed.data, filePath);

  const fileBase = basename(filePath, extname(filePath));
  const { order: prefixOrder, rest: slugBase } = splitNumericPrefix(fileBase);
  const slug = slugBase;

  const heading = firstHeading(parsed.content);
  const title = fm.title ?? heading ?? toTitleCase(slugBase);
  const order = fm.order ?? prefixOrder ?? Number.POSITIVE_INFINITY;

  return {
    section: fm.section ?? section,
    subsection,
    slug,
    title,
    description: fm.description,
    order,
    body: parsed.content,
    sourcePath: filePath,
    hidden: fm.hidden ?? false,
  };
}

/**
 * Parse a folder of guide markdown files.
 *
 * Layout:
 *   <dir>/<section>/<file>.md
 *   <dir>/<section>/<subsection>/<file>.md   (one level of nesting)
 *
 * - Files placed directly under `dir` (no section folder) are skipped.
 * - Empty or missing folder returns `[]` (not an error).
 * - Guides are sorted by (section, subsection?, order, title).
 */
export async function parseGuides(dir: string): Promise<Guide[]> {
  if (!dir || !existsSync(dir)) return [];
  let stat;
  try {
    stat = statSync(dir);
  } catch {
    return [];
  }
  if (!stat.isDirectory()) return [];

  const guides: Guide[] = [];
  // Track section/subsection folder ordering from numeric prefixes
  const sectionOrder = new Map<string, number>();
  const subsectionOrder = new Map<string, number>();

  for (const sectionDir of listDirs(dir)) {
    const sectionPath = join(dir, sectionDir);
    const { order: secOrd, rest: sectionSlug } = splitNumericPrefix(sectionDir);
    sectionOrder.set(sectionSlug, secOrd ?? Number.POSITIVE_INFINITY);

    // Files directly in section dir
    for (const file of listGuideFiles(sectionPath)) {
      guides.push(parseGuideFile(join(sectionPath, file), sectionSlug, undefined));
    }

    // One level of nested subsections
    for (const subDir of listDirs(sectionPath)) {
      const subPath = join(sectionPath, subDir);
      const { order: subOrd, rest: subSlug } = splitNumericPrefix(subDir);
      subsectionOrder.set(`${sectionSlug}/${subSlug}`, subOrd ?? Number.POSITIVE_INFINITY);
      for (const file of listGuideFiles(subPath)) {
        guides.push(parseGuideFile(join(subPath, file), sectionSlug, subSlug));
      }
    }
  }

  guides.sort((a, b) => {
    // Sort by section folder order first
    const aSecOrd = sectionOrder.get(a.section) ?? Number.POSITIVE_INFINITY;
    const bSecOrd = sectionOrder.get(b.section) ?? Number.POSITIVE_INFINITY;
    if (aSecOrd !== bSecOrd) return aSecOrd - bSecOrd;
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    // Then by subsection folder order
    const aSubKey = a.subsection ? `${a.section}/${a.subsection}` : '';
    const bSubKey = b.subsection ? `${b.section}/${b.subsection}` : '';
    const aSubOrd = aSubKey ? (subsectionOrder.get(aSubKey) ?? Number.POSITIVE_INFINITY) : -1;
    const bSubOrd = bSubKey ? (subsectionOrder.get(bSubKey) ?? Number.POSITIVE_INFINITY) : -1;
    if (aSubOrd !== bSubOrd) return aSubOrd - bSubOrd;
    // Then by file order, then title
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });

  return guides;
}

export type * from './types.js';
export { rewriteRefs } from './rewrite-refs.js';
export type { AssetRef, RewriteResult } from './rewrite-refs.js';
