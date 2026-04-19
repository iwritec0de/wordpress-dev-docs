import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parsePhpFile } from '../index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

describe('function signatures — typed params', () => {
  it('extracts typed parameters', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const fn = result.functions.find((f) => f.name === 'typed_get')!;
    expect(fn.params).toHaveLength(2);
    expect(fn.params[0]).toMatchObject({ name: 'key', typeHint: 'string', nullable: false });
    expect(fn.params[1]).toMatchObject({
      name: 'limit',
      typeHint: 'int',
      nullable: true,
      hasDefault: true,
    });
  });

  it('extracts native return type', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const fn = result.functions.find((f) => f.name === 'typed_get')!;
    expect(fn.returnType).toBe('array');
  });

  it('handles void return type', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const fn = result.functions.find((f) => f.name === 'register_tags')!;
    expect(fn.returnType).toBe('void');
  });

  it('detects variadic params', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const fn = result.functions.find((f) => f.name === 'register_tags')!;
    expect(fn.params[0]).toMatchObject({ name: 'tags', variadic: true });
  });

  it('detects by-reference params', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const fn = result.functions.find((f) => f.name === 'process_items')!;
    expect(fn.params[0]).toMatchObject({ name: 'items', byRef: true });
  });

  it('untyped functions get null returnType and null typeHint', () => {
    const result = parsePhpFile(fixture('simple-functions.php'));
    const fn = result.functions.find((f) => f.name === 'undocumented_function')!;
    expect(fn.returnType).toBeNull();
    expect(fn.params[0]?.typeHint ?? null).toBeNull();
  });
});

describe('function signatures — define() constants', () => {
  it('extracts define() constants', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const names = result.constants.map((c) => c.name);
    expect(names).toContain('MY_PLUGIN_VERSION');
    expect(names).toContain('MY_PLUGIN_DIR');
  });

  it('captures constant value', () => {
    const result = parsePhpFile(fixture('typed-functions.php'));
    const version = result.constants.find((c) => c.name === 'MY_PLUGIN_VERSION')!;
    expect(version.value).toContain('2.1.0');
  });
});

describe('class signatures — inheritance', () => {
  it('extracts extends', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'My_Plugin')!;
    expect(cls.extends).toBe('Plugin_Base');
  });

  it('extracts implements', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'My_Plugin')!;
    expect(cls.implements).toContain('Registerable');
  });

  it('marks final class', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'My_Plugin')!;
    expect(cls.isFinal).toBe(true);
  });

  it('marks abstract class', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Plugin_Base')!;
    expect(cls.isAbstract).toBe(true);
  });

  it('marks interface', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Registerable')!;
    expect(cls.isInterface).toBe(true);
  });

  it('marks trait', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Singleton')!;
    expect(cls.isTrait).toBe(true);
  });
});

describe('class signatures — constants', () => {
  it('extracts class constants', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Plugin_Base')!;
    const names = cls.constants.map((c) => c.name);
    expect(names).toContain('SLUG');
    expect(names).toContain('NAME');
  });

  it('captures constant value', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Plugin_Base')!;
    const slug = cls.constants.find((c) => c.name === 'SLUG')!;
    expect(slug.value).toContain('my-plugin');
  });
});

describe('class signatures — typed properties', () => {
  it('extracts property type hints', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Plugin_Base')!;
    const version = cls.properties.find((p) => p.name === 'version')!;
    expect(version.typeHint).toBe('string');
  });

  it('extracts typed static property', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'Plugin_Base')!;
    const count = cls.properties.find((p) => p.name === 'count')!;
    expect(count.typeHint).toBe('int');
    expect(count.isStatic).toBe(true);
  });
});

describe('class signatures — method params + return types', () => {
  it('extracts constructor params', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'My_Plugin')!;
    const ctor = cls.methods.find((m) => m.name === '__construct')!;
    expect(ctor.params).toHaveLength(2);
    expect(ctor.params[0]).toMatchObject({ name: 'slug', typeHint: 'string' });
    expect(ctor.params[1]).toMatchObject({ name: 'debug', typeHint: 'bool', hasDefault: true });
  });

  it('extracts method return type', () => {
    const result = parsePhpFile(fixture('class-advanced.php'));
    const cls = result.classes.find((c) => c.name === 'My_Plugin')!;
    const boot = cls.methods.find((m) => m.name === 'boot')!;
    expect(boot.returnType).toBe('void');
  });
});
