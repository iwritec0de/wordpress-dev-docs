import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parsePhpFile } from '../index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

describe('parsePhpFile — functions', () => {
  it('finds all top-level functions', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const names = result.functions.map((f) => f.name);
    expect(names).toContain('my_plugin_get_settings');
    expect(names).toContain('my_plugin_update_setting');
    expect(names).toContain('undocumented_function');
  });

  it('attaches docblock to documented function', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const fn = result.functions.find((f) => f.name === 'my_plugin_get_settings')!;
    expect(fn.doc).not.toBeNull();
    expect(fn.doc!.description).toBe('Gets the plugin settings.');
    expect(fn.doc!.since).toBe('1.0.0');
    expect(fn.doc!.params).toHaveLength(2);
    expect(fn.doc!.returns?.type).toBe('mixed');
  });

  it('returns null doc for undocumented function', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const fn = result.functions.find((f) => f.name === 'undocumented_function')!;
    expect(fn.doc).toBeNull();
  });

  it('extracts deprecated tag', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const fn = result.functions.find((f) => f.name === 'my_plugin_update_setting')!;
    expect(fn.doc!.deprecated).toContain('2.0.0');
  });

  it('extracts throws', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const fn = result.functions.find((f) => f.name === 'my_plugin_update_setting')!;
    expect(fn.doc!.throws).toContain('InvalidArgumentException');
  });

  it('records source location', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const fn = result.functions.find((f) => f.name === 'my_plugin_get_settings')!;
    expect(fn.location.line).toBeGreaterThan(0);
    expect(fn.location.file).toContain('simple-functions.php');
  });
});

describe('parsePhpFile — classes', () => {
  it('finds class', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0]!.name).toBe('My_Plugin');
  });

  it('attaches class docblock', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    const cls = result.classes[0]!;
    expect(cls.doc!.description).toBe('Example plugin class.');
    expect(cls.doc!.since).toBe('1.0.0');
  });

  it('finds methods', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    const cls = result.classes[0]!;
    const names = cls.methods.map((m) => m.name);
    expect(names).toContain('__construct');
    expect(names).toContain('get_version');
    expect(names).toContain('_setup');
  });

  it('records method visibility', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    const cls = result.classes[0]!;
    const setup = cls.methods.find((m) => m.name === '_setup')!;
    expect(setup.visibility).toBe('private');
    const getVersion = cls.methods.find((m) => m.name === 'get_version')!;
    expect(getVersion.visibility).toBe('public');
  });

  it('attaches method docblocks', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    const cls = result.classes[0]!;
    const getVersion = cls.methods.find((m) => m.name === 'get_version')!;
    expect(getVersion.doc!.returns?.type).toBe('string');
  });

  it('finds properties', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    const cls = result.classes[0]!;
    const names = cls.properties.map((p) => p.name);
    expect(names).toContain('version');
    expect(names).toContain('initialized');
  });

  it('records property varType', () => {
    const result = parsePhpFile(fixture('class-example.php'));
    const cls = result.classes[0]!;
    const version = cls.properties.find((p) => p.name === 'version')!;
    expect(version.doc!.varType).toBe('string');
  });
});
