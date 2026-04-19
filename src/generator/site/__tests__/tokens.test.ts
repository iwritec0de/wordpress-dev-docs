import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  SkinSchema,
  BUILT_IN_SKINS,
  loadBuiltInSkin,
  listSkins,
  generateTokensCss,
  resolveSkinFromConfig,
  convertLegacyTheme,
} from '../tokens.js';
import type { ThemeDefinition } from '../themes.js';

const FIXTURES_DIR = new URL('../__fixtures__', import.meta.url).pathname;

describe('SkinSchema', () => {
  it('validates a minimal valid skin', () => {
    const skin = {
      name: 'test',
      tokens: {
        color: {
          bg: '#fff',
          fg: '#000',
          accent: '#00f',
          'accent-fg': '#fff',
          muted: '#888',
          border: '#ccc',
          'code-bg': '#eee',
          'sidebar-bg': '#fafafa',
          'sidebar-active': '#f0f0f0',
          surface: '#fafafa',
        },
        font: { sans: 'sans-serif', mono: 'monospace' },
        radius: { sm: '2px', md: '4px', lg: '8px' },
        container: { sidebar: '280px', content: '720px', toc: '240px' },
      },
    };
    expect(() => SkinSchema.parse(skin)).not.toThrow();
  });

  it('rejects skin missing required color token', () => {
    const skin = {
      name: 'bad',
      tokens: {
        color: { bg: '#fff' },
        font: { sans: 'sans-serif', mono: 'monospace' },
        radius: { sm: '2px', md: '4px', lg: '8px' },
        container: { sidebar: '280px', content: '720px', toc: '240px' },
      },
    };
    expect(() => SkinSchema.parse(skin)).toThrow();
  });

  it('rejects skin with empty name', () => {
    expect(() => SkinSchema.parse({ name: '', tokens: {} })).toThrow();
  });
});

describe('built-in skins', () => {
  it.each(BUILT_IN_SKINS)('loads and validates "%s" skin', (name) => {
    const skin = loadBuiltInSkin(name);
    expect(skin.name).toBeTruthy();
    expect(skin.tokens.color.bg).toBeTruthy();
    expect(skin.tokens.font.sans).toBeTruthy();
    expect(skin.tokens.radius.sm).toBeTruthy();
    expect(skin.tokens.container.sidebar).toBeTruthy();
  });

  it('throws for unknown skin name', () => {
    expect(() => loadBuiltInSkin('nonexistent')).toThrow(/Unknown skin/);
  });

  it('listSkins returns all built-in skins', () => {
    const skins = listSkins();
    expect(skins).toHaveLength(8);
    const names = skins.map((s) => s.name);
    expect(names).toContain('Default');
    expect(names).toContain('Syntax');
    expect(names).toContain('Dark Pro');
    expect(names).toContain('WordPress');
    expect(names).toContain('Terminal');
    expect(names).toContain('Sunset');
    expect(names).toContain('Midnight');
    expect(names).toContain('Sandstone');
  });
});

describe('generateTokensCss', () => {
  it('produces :root block with CSS custom properties', () => {
    const skin = loadBuiltInSkin('default');
    const css = generateTokensCss(skin);
    expect(css).toContain(':root {');
    expect(css).toContain('--color-bg:');
    expect(css).toContain('--color-accent:');
    expect(css).toContain('--font-sans:');
    expect(css).toContain('--radius-md:');
    expect(css).toContain('--sidebar-width:');
  });

  it('produces .dark block when skin has dark overrides', () => {
    const skin = loadBuiltInSkin('default');
    const css = generateTokensCss(skin);
    expect(css).toContain('.dark {');
  });

  it('omits .dark block when skin has no dark overrides', () => {
    const skin = loadBuiltInSkin('default');
    const noDark = { ...skin, dark: undefined };
    const css = generateTokensCss(noDark);
    expect(css).not.toContain('.dark {');
  });

  it('includes skin name in header comment', () => {
    const skin = loadBuiltInSkin('terminal');
    const css = generateTokensCss(skin);
    expect(css).toContain('Skin: Terminal');
  });
});

describe('resolveSkinFromConfig', () => {
  it('returns default skin when no options provided', () => {
    const skin = resolveSkinFromConfig({});
    expect(skin.name).toBe('Default');
  });

  it('resolves a built-in skin by name', () => {
    const skin = resolveSkinFromConfig({ skin: 'terminal' });
    expect(skin.name).toBe('Terminal');
  });

  it('falls back to built-in skin matching legacy theme name', () => {
    const skin = resolveSkinFromConfig({ theme: 'wordpress' });
    expect(skin.name).toBe('WordPress');
  });

  it('falls back to default for unknown legacy theme', () => {
    const skin = resolveSkinFromConfig({ theme: 'nonexistent' });
    expect(skin.name).toBe('Default');
  });

  it('layers token overrides on top of base skin', () => {
    const tmpDir = join(tmpdir(), `wpdocs-test-tokens-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    const overridesPath = join(tmpDir, 'overrides.json');
    writeFileSync(overridesPath, JSON.stringify({ color: { accent: '#ff0000' } }));

    try {
      const skin = resolveSkinFromConfig({
        skin: 'default',
        tokens: overridesPath,
      });
      expect(skin.tokens.color.accent).toBe('#ff0000');
      // Non-overridden values preserved
      expect(skin.tokens.color.bg).toBe('#ffffff');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('throws for missing token overrides file', () => {
    expect(() => resolveSkinFromConfig({ tokens: '/nonexistent/overrides.json' })).toThrow(
      /not found/
    );
  });

  it('converts a legacy theme path into a skin via convertLegacyTheme', () => {
    const skin = resolveSkinFromConfig({
      theme: './custom-theme',
      configDir: FIXTURES_DIR,
    });
    // The custom theme fixture has --color-primary: #e11d48
    expect(skin.tokens.color.accent).toBe('#e11d48');
    // --color-text: #111827
    expect(skin.tokens.color.fg).toBe('#111827');
    // Name comes from the legacy theme
    expect(skin.name).toBe('Test Custom Theme');
    // Radius/container should be filled from defaults
    expect(skin.tokens.radius.sm).toBeTruthy();
    expect(skin.tokens.container.sidebar).toBeTruthy();
  });
});

describe('convertLegacyTheme', () => {
  it('maps legacy cssVars to new token groups', () => {
    const legacy: ThemeDefinition = {
      name: 'My Legacy',
      description: 'A test theme',
      cssVars: {
        '--color-primary': '#ff0000',
        '--color-bg': '#ffffff',
        '--color-bg-secondary': '#f0f0f0',
        '--color-text': '#111111',
        '--color-text-muted': '#666666',
        '--color-border': '#cccccc',
        '--color-code-bg': '#eeeeee',
        '--font-sans': 'Arial, sans-serif',
        '--font-mono': 'Courier, monospace',
      },
    };

    const skin = convertLegacyTheme(legacy);

    expect(skin.name).toBe('My Legacy');
    expect(skin.tokens.color.accent).toBe('#ff0000');
    expect(skin.tokens.color.bg).toBe('#ffffff');
    expect(skin.tokens.color.surface).toBe('#f0f0f0');
    expect(skin.tokens.color['sidebar-bg']).toBe('#f0f0f0');
    expect(skin.tokens.color.fg).toBe('#111111');
    expect(skin.tokens.color.muted).toBe('#666666');
    expect(skin.tokens.color.border).toBe('#cccccc');
    expect(skin.tokens.color['code-bg']).toBe('#eeeeee');
    expect(skin.tokens.font.sans).toBe('Arial, sans-serif');
    expect(skin.tokens.font.mono).toBe('Courier, monospace');
  });

  it('fills missing tokens from the default skin', () => {
    const minimal: ThemeDefinition = {
      name: 'Minimal',
      description: '',
      cssVars: {
        '--color-primary': '#00ff00',
        '--color-bg': '#ffffff',
        '--color-text': '#000000',
        '--color-border': '#dddddd',
      },
    };

    const skin = convertLegacyTheme(minimal);
    const defaultSkin = loadBuiltInSkin('default');

    // Tokens not in legacy theme should come from default
    expect(skin.tokens.color['accent-fg']).toBe(defaultSkin.tokens.color['accent-fg']);
    expect(skin.tokens.color['sidebar-active']).toBe(defaultSkin.tokens.color['sidebar-active']);
    expect(skin.tokens.radius).toEqual(defaultSkin.tokens.radius);
    expect(skin.tokens.container).toEqual(defaultSkin.tokens.container);
    // Dark overrides should come from default
    expect(skin.dark).toEqual(defaultSkin.dark);
  });

  it('skips --color-primary-dark (no equivalent token)', () => {
    const legacy: ThemeDefinition = {
      name: 'With Dark Primary',
      description: '',
      cssVars: {
        '--color-primary': '#0000ff',
        '--color-primary-dark': '#000099',
        '--color-bg': '#ffffff',
        '--color-text': '#000000',
        '--color-border': '#cccccc',
      },
    };

    const skin = convertLegacyTheme(legacy);
    // accent should be from --color-primary, not --color-primary-dark
    expect(skin.tokens.color.accent).toBe('#0000ff');
  });
});
