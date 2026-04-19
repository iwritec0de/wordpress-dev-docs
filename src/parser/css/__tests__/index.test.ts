import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCssFile, parseCssContent } from '../index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

// ─── parseCssFile tests ───────────────────────────────────────────────────────

describe('parseCssFile — file doc block', () => {
  it('extracts the file-level doc block', () => {
    const result = parseCssFile(fixture('style.css'));
    expect(result.fileDoc).not.toBeNull();
  });

  it('doc block description contains expected text', () => {
    const result = parseCssFile(fixture('style.css'));
    expect(result.fileDoc!.description).toContain('My Plugin Styles');
  });

  it('doc block raw contains version tag', () => {
    const result = parseCssFile(fixture('style.css'));
    expect(result.fileDoc!.raw).toContain('@version 1.0.0');
  });
});

describe('parseCssFile — custom properties', () => {
  it('finds --color-primary in :root', () => {
    const result = parseCssFile(fixture('style.css'));
    const prop = result.customProperties.find(
      (p) => p.name === '--color-primary' && p.scope === ':root'
    );
    expect(prop).toBeDefined();
    expect(prop!.value).toBe('#2563eb');
  });

  it('finds --font-size-base in :root', () => {
    const result = parseCssFile(fixture('style.css'));
    const prop = result.customProperties.find(
      (p) => p.name === '--font-size-base' && p.scope === ':root'
    );
    expect(prop).toBeDefined();
    expect(prop!.value).toBe('16px');
  });

  it('scope is :root for root-level custom properties', () => {
    const result = parseCssFile(fixture('style.css'));
    const rootProps = result.customProperties.filter((p) => p.scope === ':root');
    expect(rootProps.length).toBeGreaterThan(0);
    const names = rootProps.map((p) => p.name);
    expect(names).toContain('--color-primary');
    expect(names).toContain('--color-secondary');
    expect(names).toContain('--font-size-base');
    expect(names).toContain('--spacing-sm');
    expect(names).toContain('--spacing-md');
    expect(names).toContain('--spacing-lg');
  });

  it('scope is .dark-mode for dark-mode custom properties', () => {
    const result = parseCssFile(fixture('style.css'));
    const darkProps = result.customProperties.filter((p) => p.scope === '.dark-mode');
    expect(darkProps.length).toBeGreaterThan(0);
    const names = darkProps.map((p) => p.name);
    expect(names).toContain('--color-primary');
    expect(names).toContain('--color-secondary');
  });

  it('captures description from preceding comment', () => {
    const result = parseCssFile(fixture('style.css'));
    const colorPrimary = result.customProperties.find(
      (p) => p.name === '--color-primary' && p.scope === ':root'
    );
    expect(colorPrimary!.description).toBe('Primary brand color');
  });

  it('captures description for --color-secondary', () => {
    const result = parseCssFile(fixture('style.css'));
    const prop = result.customProperties.find(
      (p) => p.name === '--color-secondary' && p.scope === ':root'
    );
    expect(prop!.description).toBe('Secondary brand color');
  });

  it('properties without preceding comments have null description', () => {
    const result = parseCssFile(fixture('style.css'));
    // --spacing-sm has no comment before it
    const spacingSm = result.customProperties.find(
      (p) => p.name === '--spacing-sm' && p.scope === ':root'
    );
    expect(spacingSm).toBeDefined();
    expect(spacingSm!.description).toBeNull();
  });

  it('source location line numbers are greater than 0', () => {
    const result = parseCssFile(fixture('style.css'));
    for (const prop of result.customProperties) {
      expect(prop.location.line).toBeGreaterThan(0);
    }
  });

  it('source location file matches the fixture path', () => {
    const result = parseCssFile(fixture('style.css'));
    for (const prop of result.customProperties) {
      expect(prop.location.file).toContain('style.css');
    }
  });

  it('non-custom properties are NOT included', () => {
    const result = parseCssFile(fixture('style.css'));
    const names = result.customProperties.map((p) => p.name);
    expect(names).not.toContain('color');
    expect(names).not.toContain('font-size');
  });
});

// ─── parseCssContent tests ────────────────────────────────────────────────────

describe('parseCssContent — without file I/O', () => {
  it('parses content without reading a file', () => {
    const css = `/* My plugin */\n:root { --brand: blue; }`;
    const result = parseCssContent(css, '');
    expect(result.fileDoc).not.toBeNull();
    expect(result.fileDoc!.description).toBe('My plugin');
    expect(result.customProperties).toHaveLength(1);
    expect(result.customProperties[0]!.name).toBe('--brand');
    expect(result.customProperties[0]!.value).toBe('blue');
  });

  it('returns null fileDoc when no top-level comment', () => {
    const css = `:root { --x: 1; }`;
    const result = parseCssContent(css, '');
    expect(result.fileDoc).toBeNull();
  });

  it('extracts scope from selector', () => {
    const css = `.theme-dark { --bg: #000; }`;
    const result = parseCssContent(css, 'test.css');
    expect(result.customProperties[0]!.scope).toBe('.theme-dark');
  });

  it('scope is global for root-level declarations', () => {
    const css = `--loose: 1px;`;
    const result = parseCssContent(css, 'test.css');
    expect(result.customProperties[0]!.scope).toBe('global');
  });
});
