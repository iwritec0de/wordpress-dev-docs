import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import {
  resolveTheme,
  generateThemeCss,
  listThemes,
  isCustomThemePath,
  loadCustomTheme,
  THEMES,
  REQUIRED_CSS_VARS,
} from '../themes.js';

const FIXTURES_DIR = new URL('../__fixtures__', import.meta.url).pathname;

// ─── resolveTheme ─────────────────────────────────────────────────────────────

describe('resolveTheme', () => {
  it('returns the default theme for "default"', () => {
    const theme = resolveTheme('default');
    expect(theme.name).toBe('Default');
  });

  it('returns the dark theme for "dark"', () => {
    const theme = resolveTheme('dark');
    expect(theme.name).toBe('Dark');
  });

  it('returns the WordPress theme for "wordpress"', () => {
    const theme = resolveTheme('wordpress');
    expect(theme.name).toBe('WordPress');
  });

  it('falls back to default for an unknown theme name', () => {
    const theme = resolveTheme('nonexistent-theme-xyz');
    expect(theme.name).toBe(THEMES['default']!.name);
  });

  it('falls back to default for an empty string', () => {
    const theme = resolveTheme('');
    expect(theme.name).toBe(THEMES['default']!.name);
  });
});

// ─── generateThemeCss ─────────────────────────────────────────────────────────

describe('generateThemeCss', () => {
  it('returns a string containing ":root"', () => {
    const css = generateThemeCss(resolveTheme('default'));
    expect(css).toContain(':root');
  });

  it('includes --color-primary in the output', () => {
    const css = generateThemeCss(resolveTheme('default'));
    expect(css).toContain('--color-primary');
  });

  it('wraps vars in a :root { } block', () => {
    const css = generateThemeCss(resolveTheme('default'));
    expect(css).toMatch(/:root\s*\{/);
    expect(css).toContain('}');
  });

  it('includes all cssVars entries from the theme', () => {
    const theme = resolveTheme('default');
    const css = generateThemeCss(theme);
    for (const [prop, value] of Object.entries(theme.cssVars)) {
      expect(css).toContain(prop);
      expect(css).toContain(value);
    }
  });

  it('produces different CSS for dark vs default', () => {
    const defaultCss = generateThemeCss(resolveTheme('default'));
    const darkCss = generateThemeCss(resolveTheme('dark'));
    expect(defaultCss).not.toBe(darkCss);
  });

  it('produces different CSS for wordpress vs default', () => {
    const defaultCss = generateThemeCss(resolveTheme('default'));
    const wpCss = generateThemeCss(resolveTheme('wordpress'));
    expect(defaultCss).not.toBe(wpCss);
  });

  it('output is non-empty for every built-in theme', () => {
    for (const theme of listThemes()) {
      const css = generateThemeCss(theme);
      expect(css.length).toBeGreaterThan(0);
    }
  });
});

// ─── Theme structure ──────────────────────────────────────────────────────────

describe('theme required CSS variables', () => {
  it.each(Object.keys(THEMES))('theme "%s" has all required CSS vars', (key) => {
    const theme = THEMES[key]!;
    for (const varName of REQUIRED_CSS_VARS) {
      expect(theme.cssVars).toHaveProperty(varName);
    }
  });

  it.each(Object.keys(THEMES))('theme "%s" has name and description', (key) => {
    const theme = THEMES[key]!;
    expect(typeof theme.name).toBe('string');
    expect(theme.name.length).toBeGreaterThan(0);
    expect(typeof theme.description).toBe('string');
    expect(theme.description.length).toBeGreaterThan(0);
  });
});

// ─── listThemes ───────────────────────────────────────────────────────────────

describe('listThemes', () => {
  it('returns at least 3 themes', () => {
    expect(listThemes().length).toBeGreaterThanOrEqual(3);
  });

  it('all returned items have a name', () => {
    for (const theme of listThemes()) {
      expect(typeof theme.name).toBe('string');
      expect(theme.name.length).toBeGreaterThan(0);
    }
  });

  it('all returned items have a description', () => {
    for (const theme of listThemes()) {
      expect(typeof theme.description).toBe('string');
      expect(theme.description.length).toBeGreaterThan(0);
    }
  });

  it('includes default, dark, and wordpress themes', () => {
    const names = listThemes().map((t) => t.name);
    expect(names).toContain('Default');
    expect(names).toContain('Dark');
    expect(names).toContain('WordPress');
  });
});

// ─── isCustomThemePath ────────────────────────────────────────────────────────

describe('isCustomThemePath', () => {
  it('returns true for a relative path starting with ./', () => {
    expect(isCustomThemePath('./my-theme')).toBe(true);
  });

  it('returns true for a relative path starting with ../', () => {
    expect(isCustomThemePath('../themes/my-theme')).toBe(true);
  });

  it('returns true for an absolute path starting with /', () => {
    expect(isCustomThemePath('/absolute/path')).toBe(true);
  });

  it('returns false for the built-in "default" name', () => {
    expect(isCustomThemePath('default')).toBe(false);
  });

  it('returns false for the built-in "dark" name', () => {
    expect(isCustomThemePath('dark')).toBe(false);
  });

  it('returns false for the built-in "wordpress" name', () => {
    expect(isCustomThemePath('wordpress')).toBe(false);
  });
});

// ─── loadCustomTheme ──────────────────────────────────────────────────────────

describe('loadCustomTheme', () => {
  it('loads and parses theme.json from fixture', () => {
    const theme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    expect(theme).toBeDefined();
  });

  it('returns a ThemeDefinition with the correct name', () => {
    const theme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    expect(theme.name).toBe('Test Custom Theme');
  });

  it('returns a ThemeDefinition with the correct description', () => {
    const theme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    expect(theme.description).toBe('A custom theme for testing');
  });

  it('returns the correct cssVars from the fixture', () => {
    const theme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    expect(theme.cssVars['--color-primary']).toBe('#e11d48');
    expect(theme.cssVars['--color-bg']).toBe('#ffffff');
    expect(theme.cssVars['--color-text']).toBe('#111827');
    expect(theme.cssVars['--color-border']).toBe('#e5e7eb');
  });

  it('throws a descriptive error when theme.json is missing', () => {
    expect(() => loadCustomTheme('./nonexistent-theme', FIXTURES_DIR)).toThrow(/theme.json/);
  });

  it('throws a descriptive error when theme.json contains invalid JSON', () => {
    const dir = join(tmpdir(), `bad-theme-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'theme.json'), 'not valid json { ');
    try {
      expect(() => loadCustomTheme(dir, '/')).toThrow(/Invalid JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ─── resolveTheme (custom path) ───────────────────────────────────────────────

describe('resolveTheme with custom theme path', () => {
  it('loads a custom theme when given a path and baseDir', () => {
    const theme = resolveTheme('./custom-theme', FIXTURES_DIR);
    expect(theme.name).toBe('Test Custom Theme');
  });

  it('still returns the built-in default when given "default" and a baseDir', () => {
    const theme = resolveTheme('default', FIXTURES_DIR);
    expect(theme.name).toBe('Default');
  });

  it('still returns the built-in dark theme when given "dark" and a baseDir', () => {
    const theme = resolveTheme('dark', FIXTURES_DIR);
    expect(theme.name).toBe('Dark');
  });

  it('falls back to default for an unknown non-path name even with baseDir', () => {
    const theme = resolveTheme('mystery-theme', FIXTURES_DIR);
    expect(theme.name).toBe('Default');
  });
});

// ─── generateThemeCss with custom theme ──────────────────────────────────────

describe('generateThemeCss with custom theme', () => {
  it('generates valid CSS for a loaded custom theme', () => {
    const theme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    const css = generateThemeCss(theme);
    expect(css).toContain(':root');
    expect(css).toContain('--color-primary');
    expect(css).toContain('#e11d48');
  });

  it('custom theme CSS differs from built-in default CSS', () => {
    const customTheme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    const customCss = generateThemeCss(customTheme);
    const defaultCss = generateThemeCss(resolveTheme('default'));
    expect(customCss).not.toBe(defaultCss);
  });

  it('includes all cssVars entries from the custom theme', () => {
    const theme = loadCustomTheme('./custom-theme', FIXTURES_DIR);
    const css = generateThemeCss(theme);
    for (const [prop, value] of Object.entries(theme.cssVars)) {
      expect(css).toContain(prop);
      expect(css).toContain(value);
    }
  });
});
