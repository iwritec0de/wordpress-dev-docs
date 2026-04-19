import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseReadme, parseReadmeContent } from '../readme.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

// ─── Fixture-based tests ──────────────────────────────────────────────────────

describe('parseReadme — fixture file (readme.txt)', () => {
  const data = parseReadme(fixture('readme.txt'));

  it('parses the plugin name', () => {
    expect(data.name).toBe('My Awesome Plugin');
  });

  it('parses contributors as an array', () => {
    expect(data.contributors).toEqual(['janedoe', 'bobsmith']);
  });

  it('parses donate link', () => {
    expect(data.donateLink).toBe('https://example.com/donate');
  });

  it('parses tags as an array', () => {
    expect(data.tags).toEqual(['plugin', 'utility', 'seo', 'performance']);
  });

  it('parses requiresAtLeast', () => {
    expect(data.requiresAtLeast).toBe('6.0');
  });

  it('parses testedUpTo', () => {
    expect(data.testedUpTo).toBe('6.5');
  });

  it('parses stableTag', () => {
    expect(data.stableTag).toBe('1.2.3');
  });

  it('parses requiresPhp', () => {
    expect(data.requiresPhp).toBe('8.0');
  });

  it('parses license', () => {
    expect(data.license).toBe('GPLv2 or later');
  });

  it('parses licenseUri', () => {
    expect(data.licenseUri).toBe('https://www.gnu.org/licenses/gpl-2.0.html');
  });

  it('parses short description', () => {
    expect(data.shortDescription).toContain('lightweight utility plugin');
  });

  it('parses description section', () => {
    expect(data.description).toBeDefined();
    expect(data.description).toContain('My Awesome Plugin');
    expect(data.description).toContain('image optimization');
  });

  it('parses installation section', () => {
    expect(data.installation).toBeDefined();
    expect(data.installation).toContain('wp-content/plugins');
  });
});

// ─── FAQ parsing ─────────────────────────────────────────────────────────────

describe('parseReadme — FAQ section', () => {
  const data = parseReadme(fixture('readme.txt'));

  it('extracts FAQ entries', () => {
    expect(data.faq.length).toBeGreaterThanOrEqual(3);
  });

  it('has correct question and answer for first FAQ entry', () => {
    const first = data.faq[0];
    expect(first.question).toContain('my theme');
    expect(first.answer).toContain('well-coded WordPress theme');
  });

  it('has correct question for second FAQ entry', () => {
    const second = data.faq[1];
    expect(second.question).toContain('slow down');
  });
});

// ─── Changelog parsing ───────────────────────────────────────────────────────

describe('parseReadme — Changelog section', () => {
  const data = parseReadme(fixture('readme.txt'));

  it('extracts changelog versions', () => {
    expect(data.changelog.length).toBeGreaterThanOrEqual(4);
  });

  it('first entry is version 1.2.3', () => {
    expect(data.changelog[0].version).toBe('1.2.3');
  });

  it('first entry has notes', () => {
    expect(data.changelog[0].notes.length).toBeGreaterThanOrEqual(3);
  });

  it('notes do not have leading bullet markers', () => {
    for (const note of data.changelog[0].notes) {
      expect(note).not.toMatch(/^[*\-•]\s/);
    }
  });

  it('notes contain expected content', () => {
    const noteText = data.changelog[0].notes.join(' ');
    expect(noteText).toContain('WooCommerce');
  });
});

// ─── Screenshots parsing ─────────────────────────────────────────────────────

describe('parseReadme — Screenshots section', () => {
  const data = parseReadme(fixture('readme.txt'));

  it('extracts screenshot descriptions', () => {
    expect(data.screenshots.length).toBe(3);
  });

  it('first screenshot description is correct', () => {
    expect(data.screenshots[0]).toContain('settings page');
  });
});

// ─── Extra sections ───────────────────────────────────────────────────────────

describe('parseReadme — extra sections', () => {
  const data = parseReadme(fixture('readme.txt'));

  it('captures Upgrade Notice as extra section', () => {
    expect(data.sections['upgrade notice']).toBeDefined();
    expect(data.sections['upgrade notice']).toContain('WooCommerce');
  });
});

// ─── parseReadmeContent (content string API) ─────────────────────────────────

describe('parseReadmeContent', () => {
  const minimal = `=== My Mini Plugin ===
Contributors: alice
Tags: cool
Requires at least: 5.9
Tested up to: 6.4
Stable tag: 0.1.0
Requires PHP: 7.4
License: MIT

A tiny plugin for testing purposes.

== Description ==

This is the full description.

== Frequently Asked Questions ==

= Is it free? =

Yes, completely free.

== Changelog ==

= 0.1.0 =
* Initial release
`;

  it('parses name from content string', () => {
    const d = parseReadmeContent(minimal);
    expect(d.name).toBe('My Mini Plugin');
  });

  it('parses short description from content string', () => {
    const d = parseReadmeContent(minimal);
    expect(d.shortDescription).toBe('A tiny plugin for testing purposes.');
  });

  it('parses description section from content string', () => {
    const d = parseReadmeContent(minimal);
    expect(d.description).toContain('full description');
  });

  it('parses single FAQ entry', () => {
    const d = parseReadmeContent(minimal);
    expect(d.faq.length).toBe(1);
    expect(d.faq[0].question).toBe('Is it free?');
    expect(d.faq[0].answer).toContain('completely free');
  });

  it('parses changelog entry', () => {
    const d = parseReadmeContent(minimal);
    expect(d.changelog.length).toBe(1);
    expect(d.changelog[0].version).toBe('0.1.0');
    expect(d.changelog[0].notes).toContain('Initial release');
  });

  it('returns empty faq array when no FAQ section', () => {
    const d = parseReadmeContent(`=== Test ===\nContributors: x\n\nShort desc.\n`);
    expect(d.faq).toEqual([]);
  });

  it('returns empty changelog when no Changelog section', () => {
    const d = parseReadmeContent(`=== Test ===\nContributors: x\n\nShort desc.\n`);
    expect(d.changelog).toEqual([]);
  });

  it('returns empty screenshots when no Screenshots section', () => {
    const d = parseReadmeContent(`=== Test ===\nContributors: x\n\nShort desc.\n`);
    expect(d.screenshots).toEqual([]);
  });

  it('missing optional fields are undefined', () => {
    const d = parseReadmeContent(`=== Test ===\nContributors: x\n\nShort desc.\n`);
    expect(d.donateLink).toBeUndefined();
    expect(d.description).toBeUndefined();
    expect(d.installation).toBeUndefined();
    expect(d.requiresAtLeast).toBeUndefined();
    expect(d.testedUpTo).toBeUndefined();
    expect(d.stableTag).toBeUndefined();
    expect(d.requiresPhp).toBeUndefined();
    expect(d.license).toBeUndefined();
    expect(d.licenseUri).toBeUndefined();
  });
});
