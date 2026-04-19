import { readFileSync } from 'fs';
import type { ChangelogEntry } from './types.js';

/**
 * Parse a Keep a Changelog–style CHANGELOG.md file.
 *
 * Supports the standard format:
 *   ## [Version] — Date
 *   ### Category
 *   - Note
 *
 * Returns an array of {@link ChangelogEntry} objects identical to the
 * readme.txt changelog parser output so both feed the same pipeline.
 */
export function parseChangelogMd(file: string): ChangelogEntry[] {
  const content = readFileSync(file, 'utf8');
  return parseChangelogMdContent(content);
}

/** Parse CHANGELOG.md content (no file I/O — testable). */
export function parseChangelogMdContent(content: string): ChangelogEntry[] {
  const lines = content.split('\n');
  const entries: ChangelogEntry[] = [];
  let currentVersion: string | null = null;
  let currentNotes: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Match ## [1.2.0] or ## [1.2.0] — 2024-03-15 or ## [Unreleased]
    const versionMatch = trimmed.match(/^##\s+\[(.+?)\]/);
    if (versionMatch) {
      if (currentVersion !== null && currentNotes.length > 0) {
        entries.push({ version: currentVersion, notes: currentNotes });
      }
      currentVersion = versionMatch[1]!;
      currentNotes = [];
      continue;
    }

    // Skip ### Category headers, horizontal rules, and link references
    if (/^###\s+/.test(trimmed)) continue;
    if (/^---+$/.test(trimmed)) continue;
    if (/^\[.+\]:\s+http/.test(trimmed)) continue;

    // Collect bullet items
    if (currentVersion !== null && /^[-*]\s+/.test(trimmed)) {
      currentNotes.push(trimmed.replace(/^[-*]\s+/, ''));
    }
  }

  // Final entry
  if (currentVersion !== null && currentNotes.length > 0) {
    entries.push({ version: currentVersion, notes: currentNotes });
  }

  // Filter out [Unreleased] if it has no notes (common placeholder)
  return entries.filter((e) => e.version.toLowerCase() !== 'unreleased' || e.notes.length > 0);
}
