/**
 * Types for the MDX guides parser (F2).
 *
 * A "guide" is a user-authored `.md` or `.mdx` file living under a
 * guides folder. Folder structure drives navigation:
 *   guides/<section>/<file>.md
 *   guides/<section>/<subsection>/<file>.md  (one level of nesting)
 */

export interface GuideFrontmatter {
  title?: string;
  description?: string;
  order?: number;
  /** Optional explicit section override (otherwise inferred from folder). */
  section?: string;
  /** If true, the guide is parsed but omitted from navigation. */
  hidden?: boolean;
}

export interface Guide {
  /** Top-level section slug (folder name under guides root). */
  section: string;
  /** Optional subsection slug (second-level folder). */
  subsection?: string;
  /** File slug (filename without extension, numeric prefix stripped). */
  slug: string;
  title: string;
  description?: string;
  /** Resolved order (frontmatter > numeric filename prefix > Infinity). */
  order: number;
  /** Raw body content with frontmatter stripped. */
  body: string;
  /** Absolute source file path. */
  sourcePath: string;
  /** True if this guide should be omitted from navigation. */
  hidden: boolean;
}

export interface GuideNavItem {
  title: string;
  /** URL slug relative to the site root, e.g. `guides/intro/welcome`. */
  slug: string;
}

export interface GuideSection {
  title: string;
  /** URL slug for the section root, e.g. `guides/intro`. */
  slug: string;
  items: GuideNavItem[];
  subsections?: GuideSection[];
}
