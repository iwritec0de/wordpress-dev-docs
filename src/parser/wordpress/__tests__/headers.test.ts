import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { extractPluginHeader, extractThemeHeader } from '../headers.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

// ─── Plugin header tests ──────────────────────────────────────────────────────

describe('extractPluginHeader — fixture file', () => {
  it('returns a non-null result for a valid plugin header', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'));
    expect(header).not.toBeNull();
  });

  it('extracts pluginName', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.pluginName).toBe('My Awesome Plugin');
  });

  it('extracts pluginUri', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.pluginUri).toBe('https://example.com/my-awesome-plugin');
  });

  it('extracts description', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.description).toContain('realistic WordPress plugin');
  });

  it('extracts version', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.version).toBe('1.2.3');
  });

  it('extracts author', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.author).toBe('Jane Doe');
  });

  it('extracts authorUri', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.authorUri).toBe('https://example.com');
  });

  it('extracts license', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.license).toBe('GPL-2.0+');
  });

  it('extracts licenseUri', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.licenseUri).toBe('https://www.gnu.org/licenses/gpl-2.0.html');
  });

  it('extracts textDomain', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.textDomain).toBe('my-awesome-plugin');
  });

  it('extracts domainPath', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.domainPath).toBe('/languages');
  });

  it('extracts requiresAtLeast', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.requiresAtLeast).toBe('6.0');
  });

  it('extracts requiresPhp', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.requiresPhp).toBe('8.0');
  });

  it('extracts network as boolean false', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.network).toBe(false);
  });

  it('extracts updateUri', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.updateUri).toBe('https://example.com/my-awesome-plugin/update');
  });

  it('includes the file path', () => {
    const header = extractPluginHeader(fixture('plugin-main.php'))!;
    expect(header.file).toContain('plugin-main.php');
  });
});

describe('extractPluginHeader — edge cases', () => {
  it('returns null when Plugin Name is missing', () => {
    const tmp = resolve(tmpdir(), 'no-plugin-name.php');
    writeFileSync(tmp, '<?php\n/* Description: Something */\n');
    try {
      expect(extractPluginHeader(tmp)).toBeNull();
    } finally {
      unlinkSync(tmp);
    }
  });

  it('returns null when there is no block comment', () => {
    const tmp = resolve(tmpdir(), 'no-comment.php');
    writeFileSync(tmp, '<?php\n// Just a line comment\n');
    try {
      expect(extractPluginHeader(tmp)).toBeNull();
    } finally {
      unlinkSync(tmp);
    }
  });

  it('handles Windows CRLF line endings', () => {
    const tmp = resolve(tmpdir(), 'crlf-plugin.php');
    const content = '<?php\r\n/**\r\n * Plugin Name: CRLF Plugin\r\n * Version: 2.0\r\n */\r\n';
    writeFileSync(tmp, content);
    try {
      const header = extractPluginHeader(tmp)!;
      expect(header).not.toBeNull();
      expect(header.pluginName).toBe('CRLF Plugin');
      expect(header.version).toBe('2.0');
    } finally {
      unlinkSync(tmp);
    }
  });

  it('parses network: true correctly', () => {
    const tmp = resolve(tmpdir(), 'network-plugin.php');
    writeFileSync(tmp, '<?php\n/**\n * Plugin Name: Network Plugin\n * Network: true\n */\n');
    try {
      const header = extractPluginHeader(tmp)!;
      expect(header.network).toBe(true);
    } finally {
      unlinkSync(tmp);
    }
  });

  it('ignores lines without the colon pattern', () => {
    const tmp = resolve(tmpdir(), 'noisy-plugin.php');
    writeFileSync(
      tmp,
      '<?php\n/**\n * Plugin Name: Clean Plugin\n * Just a random comment line\n */\n'
    );
    try {
      const header = extractPluginHeader(tmp)!;
      expect(header.pluginName).toBe('Clean Plugin');
    } finally {
      unlinkSync(tmp);
    }
  });

  it('only reads optional fields that are present', () => {
    const tmp = resolve(tmpdir(), 'minimal-plugin.php');
    writeFileSync(tmp, '<?php\n/**\n * Plugin Name: Minimal\n */\n');
    try {
      const header = extractPluginHeader(tmp)!;
      expect(header.pluginName).toBe('Minimal');
      expect(header.version).toBeUndefined();
      expect(header.author).toBeUndefined();
      expect(header.textDomain).toBeUndefined();
    } finally {
      unlinkSync(tmp);
    }
  });
});

// ─── Theme header tests ───────────────────────────────────────────────────────

describe('extractThemeHeader — fixture file', () => {
  it('returns a non-null result for a valid theme header', () => {
    const header = extractThemeHeader(fixture('theme-style.css'));
    expect(header).not.toBeNull();
  });

  it('extracts themeName', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.themeName).toBe('My Awesome Theme');
  });

  it('extracts themeUri', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.themeUri).toBe('https://example.com/my-awesome-theme');
  });

  it('extracts description', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.description).toContain('realistic WordPress theme');
  });

  it('extracts version', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.version).toBe('1.0.0');
  });

  it('extracts author', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.author).toBe('Jane Doe');
  });

  it('extracts authorUri', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.authorUri).toBe('https://example.com');
  });

  it('extracts license', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.license).toBe('GPL-2.0+');
  });

  it('extracts textDomain', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.textDomain).toBe('my-awesome-theme');
  });

  it('extracts template (parent theme)', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.template).toBe('twentytwentyfour');
  });

  it('extracts tags as an array', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(Array.isArray(header.tags)).toBe(true);
    expect(header.tags).toContain('blog');
    expect(header.tags).toContain('portfolio');
    expect(header.tags).toContain('responsive-layout');
    expect(header.tags).toContain('custom-colors');
    expect(header.tags).toContain('custom-menu');
  });

  it('includes the file path', () => {
    const header = extractThemeHeader(fixture('theme-style.css'))!;
    expect(header.file).toContain('theme-style.css');
  });
});

describe('extractThemeHeader — edge cases', () => {
  it('returns null when Theme Name is missing', () => {
    const tmp = resolve(tmpdir(), 'no-theme-name.css');
    writeFileSync(tmp, '/* Description: Something */\n');
    try {
      expect(extractThemeHeader(tmp)).toBeNull();
    } finally {
      unlinkSync(tmp);
    }
  });

  it('returns null when there is no block comment', () => {
    const tmp = resolve(tmpdir(), 'no-comment.css');
    writeFileSync(tmp, 'body { margin: 0; }\n');
    try {
      expect(extractThemeHeader(tmp)).toBeNull();
    } finally {
      unlinkSync(tmp);
    }
  });

  it('handles Windows CRLF line endings', () => {
    const tmp = resolve(tmpdir(), 'crlf-theme.css');
    const content = '/*\r\nTheme Name: CRLF Theme\r\nVersion: 3.0\r\n*/\r\n';
    writeFileSync(tmp, content);
    try {
      const header = extractThemeHeader(tmp)!;
      expect(header).not.toBeNull();
      expect(header.themeName).toBe('CRLF Theme');
      expect(header.version).toBe('3.0');
    } finally {
      unlinkSync(tmp);
    }
  });

  it('handles theme with no tags', () => {
    const tmp = resolve(tmpdir(), 'minimal-theme.css');
    writeFileSync(tmp, '/*\nTheme Name: Minimal Theme\n*/\n');
    try {
      const header = extractThemeHeader(tmp)!;
      expect(header.themeName).toBe('Minimal Theme');
      expect(header.tags).toBeUndefined();
    } finally {
      unlinkSync(tmp);
    }
  });

  it('handles theme with no template (not a child theme)', () => {
    const tmp = resolve(tmpdir(), 'standalone-theme.css');
    writeFileSync(tmp, '/*\nTheme Name: Standalone\nVersion: 1.0\n*/\n');
    try {
      const header = extractThemeHeader(tmp)!;
      expect(header.template).toBeUndefined();
    } finally {
      unlinkSync(tmp);
    }
  });

  it('trims whitespace from field values', () => {
    const tmp = resolve(tmpdir(), 'whitespace-theme.css');
    writeFileSync(tmp, '/*\nTheme Name:   Spaced Theme   \nVersion:   2.5   \n*/\n');
    try {
      const header = extractThemeHeader(tmp)!;
      expect(header.themeName).toBe('Spaced Theme');
      expect(header.version).toBe('2.5');
    } finally {
      unlinkSync(tmp);
    }
  });
});
