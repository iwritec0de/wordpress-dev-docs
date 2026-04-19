import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// ─── Theme definitions ────────────────────────────────────────────────────────

export interface ThemeDefinition {
  name: string;
  description: string;
  cssVars: Record<string, string>; // CSS custom property name → value
}

/** Required CSS variable keys that every theme must define */
export const REQUIRED_CSS_VARS = [
  '--color-primary',
  '--color-bg',
  '--color-text',
  '--color-border',
] as const;

export const THEMES: Record<string, ThemeDefinition> = {
  default: {
    name: 'Default',
    description: 'Clean blue and white developer documentation theme',
    cssVars: {
      '--color-primary': '#2563eb', // blue-600
      '--color-primary-dark': '#1d4ed8', // blue-700
      '--color-bg': '#ffffff',
      '--color-bg-secondary': '#f8fafc',
      '--color-text': '#0f172a',
      '--color-text-muted': '#64748b',
      '--color-border': '#e2e8f0',
      '--color-code-bg': '#f1f5f9',
      '--font-sans': 'Inter, system-ui, sans-serif',
      '--font-mono': '"JetBrains Mono", "Fira Code", monospace',
    },
  },
  dark: {
    name: 'Dark',
    description: 'Dark mode theme for night-time documentation reading',
    cssVars: {
      '--color-primary': '#60a5fa', // blue-400
      '--color-primary-dark': '#93c5fd', // blue-300
      '--color-bg': '#0f172a',
      '--color-bg-secondary': '#1e293b',
      '--color-text': '#f1f5f9',
      '--color-text-muted': '#94a3b8',
      '--color-border': '#334155',
      '--color-code-bg': '#1e293b',
      '--font-sans': 'Inter, system-ui, sans-serif',
      '--font-mono': '"JetBrains Mono", "Fira Code", monospace',
    },
  },
  wordpress: {
    name: 'WordPress',
    description: 'WordPress-inspired blue and grey theme',
    cssVars: {
      '--color-primary': '#0073aa', // WP blue
      '--color-primary-dark': '#005177',
      '--color-bg': '#ffffff',
      '--color-bg-secondary': '#f6f7f7', // WP admin bg
      '--color-text': '#3c434a', // WP text
      '--color-text-muted': '#787c82',
      '--color-border': '#dcdcde',
      '--color-code-bg': '#f6f7f7',
      '--font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      '--font-mono': 'Consolas, monaco, monospace',
    },
  },
};

/**
 * Returns true if the theme string looks like a file-system path:
 * starts with `./`, `../`, or `/`.
 */
export function isCustomThemePath(theme: string): boolean {
  return theme.startsWith('./') || theme.startsWith('../') || theme.startsWith('/');
}

/**
 * Load a custom theme from a directory on disk.
 *
 * Expects `{themePath}/theme.json` relative to `baseDir` (unless `themePath`
 * is already absolute).  Throws a descriptive error when the file is missing
 * or contains invalid JSON / missing required fields.
 */
export function loadCustomTheme(themePath: string, baseDir: string): ThemeDefinition {
  const absoluteThemeDir = resolve(baseDir, themePath);
  const themeJsonPath = join(absoluteThemeDir, 'theme.json');

  if (!existsSync(themeJsonPath)) {
    throw new Error(
      `Custom theme not found: expected theme.json at "${themeJsonPath}". ` +
        `Resolved from theme path "${themePath}" relative to "${baseDir}".`
    );
  }

  let raw: string;
  try {
    raw = readFileSync(themeJsonPath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read custom theme file "${themeJsonPath}": ${String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in custom theme file "${themeJsonPath}".`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Custom theme file "${themeJsonPath}" must contain a JSON object.`);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj['name'] !== 'string' || obj['name'].trim() === '') {
    throw new Error(`Custom theme at "${themeJsonPath}" is missing a "name" string field.`);
  }

  if (
    typeof obj['cssVars'] !== 'object' ||
    obj['cssVars'] === null ||
    Array.isArray(obj['cssVars'])
  ) {
    throw new Error(`Custom theme at "${themeJsonPath}" is missing a "cssVars" object field.`);
  }

  // Validate required CSS vars are present
  const cssVars = obj['cssVars'] as Record<string, unknown>;
  for (const required of REQUIRED_CSS_VARS) {
    if (!(required in cssVars)) {
      throw new Error(
        `Custom theme at "${themeJsonPath}" is missing required CSS variable "${required}".`
      );
    }
  }

  // Coerce all cssVars values to strings
  const finalCssVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(cssVars)) {
    finalCssVars[key] = String(value);
  }

  return {
    name: obj['name'] as string,
    description: typeof obj['description'] === 'string' ? obj['description'] : '',
    cssVars: finalCssVars,
  };
}

/**
 * Resolve a theme by name, falling back to 'default' if the name is unknown.
 *
 * When `themeName` looks like a path (starts with `./`, `../`, or `/`) and
 * `baseDir` is provided, the theme is loaded from disk via `loadCustomTheme`.
 */
export function resolveTheme(themeName: string, baseDir?: string): ThemeDefinition {
  if (isCustomThemePath(themeName) && baseDir) {
    return loadCustomTheme(themeName, baseDir);
  }
  return THEMES[themeName] ?? THEMES['default']!;
}

/**
 * Generate a CSS `:root { ... }` block from a theme's CSS custom properties.
 */
export function generateThemeCss(theme: ThemeDefinition): string {
  const vars = Object.entries(theme.cssVars)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n');
  return `:root {\n${vars}\n}\n`;
}

/**
 * Return all built-in themes as an array.
 */
export function listThemes(): ThemeDefinition[] {
  return Object.values(THEMES);
}
