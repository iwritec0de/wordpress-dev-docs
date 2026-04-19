import { readFileSync } from 'fs';
import postcss from 'postcss';
import type { CssCustomProperty, CssDocBlock, CssParseResult, SourceLocation } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripComment(raw: string): string {
  return raw
    .replace(/^\/\*+/, '')
    .replace(/\*+\/$/, '')
    .trim();
}

/**
 * Extract description text from a raw comment string (stripped of delimiters).
 * Removes leading " * " prefixes from each line.
 */
function extractDescription(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
}

function makeLocation(file: string, node: postcss.Node): SourceLocation {
  return {
    file,
    line: node.source?.start?.line ?? 0,
    column: node.source?.start?.column ?? 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse CSS content and extract file-level doc block and CSS custom properties.
 */
export function parseCssContent(content: string, filename: string): CssParseResult {
  const root = postcss.parse(content, { from: filename || undefined });

  // ── File-level doc block ───────────────────────────────────────────────────
  let fileDoc: CssDocBlock | null = null;
  for (const node of root.nodes) {
    if (node.type === 'comment') {
      const raw = stripComment(node.text ?? '');
      const description = extractDescription(raw);
      fileDoc = { description, raw };
      break;
    }
    // Stop if we encounter a non-whitespace rule before any comment
    if (node.type === 'rule' || node.type === 'atrule' || node.type === 'decl') {
      break;
    }
  }

  // ── Custom properties ──────────────────────────────────────────────────────
  const customProperties: CssCustomProperty[] = [];

  root.walkDecls(/^--/, (decl) => {
    const parent = decl.parent;

    // Determine scope
    let scope = 'global';
    if (parent && parent.type === 'rule') {
      scope = (parent as postcss.Rule).selector;
    }

    // Determine description from preceding sibling
    let description: string | null = null;
    const prev = decl.prev();
    if (prev && prev.type === 'comment') {
      description = stripComment(prev.text ?? '').trim() || null;
    } else {
      // Check raws.before for an inline comment on the preceding line
      const rawBefore = decl.raws.before ?? '';
      const inlineMatch = rawBefore.match(/\/\*([^*]|\*(?!\/))*\*\//);
      if (inlineMatch) {
        description = stripComment(inlineMatch[0]).trim() || null;
      }
    }

    customProperties.push({
      name: decl.prop,
      value: decl.value,
      description,
      scope,
      location: makeLocation(filename, decl),
    });
  });

  return { file: filename, fileDoc, customProperties };
}

/**
 * Parse a CSS file from disk and extract file-level doc block and CSS custom properties.
 */
export function parseCssFile(file: string): CssParseResult {
  const content = readFileSync(file, 'utf8');
  return parseCssContent(content, file);
}

export type * from './types.js';
