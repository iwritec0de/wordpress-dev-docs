import { readFileSync } from 'fs';
import type { ReadmeData, FaqEntry, ChangelogEntry } from './types.js';

export type { ReadmeData, FaqEntry, ChangelogEntry };

// ─── Section regex patterns ───────────────────────────────────────────────────

/** Matches == Section Name == headers (top-level sections) */
const SECTION_HEADER_RE = /^==\s+(.+?)\s+==\s*$/;

/** Matches = Sub Header = (FAQ questions, changelog versions) */
const SUB_HEADER_RE = /^=\s+(.+?)\s+=\s*$/;

/** Matches === Plugin Name === (the title line) */
const TITLE_RE = /^===\s+(.+?)\s+===\s*$/;

/** Matches Key: value metadata lines */
const META_RE = /^([A-Za-z][A-Za-z\s]+?):\s*(.*)$/;

// ─── Key normalisation ────────────────────────────────────────────────────────

/**
 * Normalise a header key like "Requires at least" → "requiresAtLeast".
 * Strips non-alphanumeric chars, splits on spaces, camelCases.
 */
function toCamelCase(raw: string): string {
  const words = raw
    .trim()
    .toLowerCase()
    .split(/[\s_-]+/);
  return words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function splitIntoSections(content: string): { header: string; sections: Map<string, string> } {
  const lines = content.split('\n');
  const sections = new Map<string, string>();
  let headerLines: string[] = [];
  let currentSection: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(SECTION_HEADER_RE);
    if (sectionMatch) {
      // Save whatever we were accumulating
      if (currentSection !== null) {
        sections.set(currentSection.toLowerCase(), currentLines.join('\n').trimEnd());
      } else {
        headerLines = currentLines;
      }
      currentSection = sectionMatch[1]!;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Save last section (or header if no sections found)
  if (currentSection !== null) {
    sections.set(currentSection.toLowerCase(), currentLines.join('\n').trimEnd());
  } else {
    headerLines = currentLines;
  }

  return { header: headerLines.join('\n'), sections };
}

function parseHeader(header: string): {
  name: string;
  meta: Record<string, string>;
  shortDescription: string;
} {
  const lines = header.split('\n');
  let name = '';
  const meta: Record<string, string> = {};
  let shortDescription = '';
  let inMetaBlock = true;

  for (const line of lines) {
    const trimmed = line.trim();

    // First line: title
    if (!name) {
      const titleMatch = trimmed.match(TITLE_RE);
      if (titleMatch) {
        name = titleMatch[1]!;
        continue;
      }
    }

    if (inMetaBlock) {
      if (trimmed === '') continue; // skip blank lines within header

      const metaMatch = trimmed.match(META_RE);
      if (metaMatch) {
        const key = toCamelCase(metaMatch[1]!);
        meta[key] = metaMatch[2]!.trim();
        continue;
      }

      // Non-meta, non-blank line after meta block ends => start of short description
      inMetaBlock = false;
    }

    // Short description: first non-empty paragraph after meta block
    if (!shortDescription && trimmed !== '') {
      shortDescription = trimmed;
    }
  }

  return { name, meta, shortDescription };
}

function parseFaq(content: string): FaqEntry[] {
  const lines = content.split('\n');
  const entries: FaqEntry[] = [];
  let currentQuestion: string | null = null;
  let currentAnswerLines: string[] = [];

  for (const line of lines) {
    const subMatch = line.trim().match(SUB_HEADER_RE);
    if (subMatch) {
      if (currentQuestion !== null) {
        entries.push({
          question: currentQuestion,
          answer: currentAnswerLines.join('\n').trim(),
        });
      }
      currentQuestion = subMatch[1]!;
      currentAnswerLines = [];
    } else if (currentQuestion !== null) {
      currentAnswerLines.push(line);
    }
  }

  if (currentQuestion !== null) {
    entries.push({
      question: currentQuestion,
      answer: currentAnswerLines.join('\n').trim(),
    });
  }

  return entries;
}

function parseChangelog(content: string): ChangelogEntry[] {
  const lines = content.split('\n');
  const entries: ChangelogEntry[] = [];
  let currentVersion: string | null = null;
  let currentNotes: string[] = [];

  for (const line of lines) {
    const subMatch = line.trim().match(SUB_HEADER_RE);
    if (subMatch) {
      if (currentVersion !== null) {
        entries.push({ version: currentVersion, notes: currentNotes });
      }
      currentVersion = subMatch[1]!;
      currentNotes = [];
    } else if (currentVersion !== null) {
      const trimmed = line.trim();
      if (trimmed !== '') {
        // Strip leading bullet markers (* - •)
        currentNotes.push(trimmed.replace(/^[*\-•]\s*/, ''));
      }
    }
  }

  if (currentVersion !== null) {
    entries.push({ version: currentVersion, notes: currentNotes });
  }

  return entries;
}

function parseScreenshots(content: string): string[] {
  const lines = content.split('\n');
  const screenshots: string[] = [];
  const numberedRe = /^\d+\.\s+(.+)$/;

  for (const line of lines) {
    const match = line.trim().match(numberedRe);
    if (match) {
      screenshots.push(match[1]!.trim());
    }
  }

  return screenshots;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a WordPress readme.txt file from its string content.
 * This is the main entry point for unit testing (no file I/O).
 */
export function parseReadmeContent(content: string): ReadmeData {
  const { header, sections } = splitIntoSections(content);
  const { name, meta, shortDescription } = parseHeader(header);

  // Well-known sections handled explicitly
  const knownSections = new Set([
    'description',
    'installation',
    'frequently asked questions',
    'changelog',
    'screenshots',
  ]);
  const extraSections: Record<string, string> = {};
  for (const [key, value] of sections.entries()) {
    if (!knownSections.has(key)) {
      extraSections[key] = value;
    }
  }

  return {
    name,
    contributors: splitList(meta['contributors'] ?? ''),
    donateLink: meta['donateLink'] || undefined,
    tags: splitList(meta['tags'] ?? ''),
    requiresAtLeast: meta['requiresAtLeast'] || undefined,
    testedUpTo: meta['testedUpTo'] || undefined,
    stableTag: meta['stableTag'] || undefined,
    requiresPhp: meta['requiresPhp'] || undefined,
    license: meta['license'] || undefined,
    licenseUri: meta['licenseUri'] || undefined,
    shortDescription,
    description: sections.has('description') ? sections.get('description') : undefined,
    installation: sections.has('installation') ? sections.get('installation') : undefined,
    faq: sections.has('frequently asked questions')
      ? parseFaq(sections.get('frequently asked questions')!)
      : [],
    changelog: sections.has('changelog') ? parseChangelog(sections.get('changelog')!) : [],
    screenshots: sections.has('screenshots') ? parseScreenshots(sections.get('screenshots')!) : [],
    sections: extraSections,
  };
}

/**
 * Parse a WordPress readme.txt file from disk.
 */
export function parseReadme(file: string): ReadmeData {
  const content = readFileSync(file, 'utf8');
  return parseReadmeContent(content);
}
