import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseJsFile } from '../index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

describe('parseJsFile — functions.js', () => {
  it('finds all top-level functions including undocumented', () => {
    const result = parseJsFile(fixture('functions.js'));
    const names = result.functions.map((f) => f.name);
    expect(names).toContain('initPlugin');
    expect(names).toContain('formatPrice');
    expect(names).toContain('undocumentedHelper');
  });

  it('attaches JSDoc to documented function', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'initPlugin')!;
    expect(fn.doc).not.toBeNull();
    expect(fn.doc!.description).toBe('Initializes the plugin.');
  });

  it('extracts @since from function doc', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'initPlugin')!;
    expect(fn.doc!.since).toBe('1.0.0');
  });

  it('extracts @param tags from function doc', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'initPlugin')!;
    expect(fn.doc!.params).toHaveLength(2);
    expect(fn.doc!.params[0]!.name).toBe('slug');
    expect(fn.doc!.params[0]!.type).toBe('string');
    expect(fn.doc!.params[1]!.name).toBe('options');
    expect(fn.doc!.params[1]!.optional).toBe(true);
  });

  it('extracts @returns from function doc', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'initPlugin')!;
    expect(fn.doc!.returns?.type).toBe('boolean');
    expect(fn.doc!.returns?.description).toBe('True on success.');
  });

  it('returns null doc for undocumented function', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'undocumentedHelper')!;
    expect(fn).toBeDefined();
    expect(fn.doc).toBeNull();
  });

  it('records source location with line > 0', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'initPlugin')!;
    expect(fn.location.line).toBeGreaterThan(0);
    expect(fn.location.file).toContain('functions.js');
  });

  it('handles exported arrow function (const foo = () => {})', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'formatPrice')!;
    expect(fn).toBeDefined();
    expect(fn.doc).not.toBeNull();
    expect(fn.doc!.description).toBe('Formats a price value.');
  });

  it('extracts @since from arrow function doc', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'formatPrice')!;
    expect(fn.doc!.since).toBe('1.1.0');
  });

  it('extracts @param from arrow function doc', () => {
    const result = parseJsFile(fixture('functions.js'));
    const fn = result.functions.find((f) => f.name === 'formatPrice')!;
    expect(fn.doc!.params).toHaveLength(2);
    expect(fn.doc!.params[0]!.name).toBe('amount');
    expect(fn.doc!.params[0]!.type).toBe('number');
  });

  it('does not find classes in functions fixture', () => {
    const result = parseJsFile(fixture('functions.js'));
    expect(result.classes).toHaveLength(0);
  });
});

describe('parseJsFile — class-example.js', () => {
  it('finds the exported class', () => {
    const result = parseJsFile(fixture('class-example.js'));
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0]!.name).toBe('PluginRegistry');
  });

  it('attaches JSDoc to class', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    expect(cls.doc).not.toBeNull();
    expect(cls.doc!.description).toBe('Plugin registry class.');
    expect(cls.doc!.since).toBe('1.0.0');
  });

  it('finds all class methods', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const names = cls.methods.map((m) => m.name);
    expect(names).toContain('register');
    expect(names).toContain('get');
    expect(names).toContain('getInstance');
  });

  it('attaches JSDoc to methods', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const register = cls.methods.find((m) => m.name === 'register')!;
    expect(register.doc).not.toBeNull();
    expect(register.doc!.description).toBe('Register a plugin.');
  });

  it('extracts method @param tags', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const register = cls.methods.find((m) => m.name === 'register')!;
    expect(register.doc!.params).toHaveLength(2);
    expect(register.doc!.params[0]!.name).toBe('name');
  });

  it('extracts method @returns', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const getMethod = cls.methods.find((m) => m.name === 'get')!;
    expect(getMethod.doc!.returns?.type).toBe('Function|undefined');
  });

  it('identifies static methods', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const getInstance = cls.methods.find((m) => m.name === 'getInstance')!;
    expect(getInstance.isStatic).toBe(true);
  });

  it('identifies non-static methods', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const register = cls.methods.find((m) => m.name === 'register')!;
    expect(register.isStatic).toBe(false);
  });

  it('records class source location with line > 0', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    expect(cls.location.line).toBeGreaterThan(0);
    expect(cls.location.file).toContain('class-example.js');
  });

  it('records method source location with line > 0', () => {
    const result = parseJsFile(fixture('class-example.js'));
    const cls = result.classes[0]!;
    const register = cls.methods.find((m) => m.name === 'register')!;
    expect(register.location.line).toBeGreaterThan(0);
  });

  it('does not find functions in class fixture', () => {
    const result = parseJsFile(fixture('class-example.js'));
    expect(result.functions).toHaveLength(0);
  });
});
