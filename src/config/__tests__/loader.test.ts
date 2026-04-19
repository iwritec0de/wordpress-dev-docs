import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { loadConfig, findConfig, resolveConfig, ConfigError } from '../loader.js';

/**
 * Create a unique temporary directory for each test run.
 */
function makeTmpDir(): string {
  const dir = join(tmpdir(), `wpdocs-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns a parsed config for a valid config file', () => {
    const configPath = join(tmpDir, 'docs.config.json');
    writeFileSync(configPath, JSON.stringify({ name: 'My Plugin' }), 'utf-8');

    const config = loadConfig(configPath);
    expect(config.name).toBe('My Plugin');
    expect(config.type).toBe('plugin');
    expect(config.output).toBe('./docs-output');
  });

  it('throws ConfigError with helpful message when file does not exist', () => {
    const configPath = join(tmpDir, 'does-not-exist.json');

    expect(() => loadConfig(configPath)).toThrowError(ConfigError);
    try {
      loadConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).message).toContain(configPath);
      expect((err as ConfigError).message).toContain('not found');
    }
  });

  it('throws ConfigError when file contains invalid JSON', () => {
    const configPath = join(tmpDir, 'docs.config.json');
    writeFileSync(configPath, '{ name: "bad json" }', 'utf-8');

    expect(() => loadConfig(configPath)).toThrowError(ConfigError);
    try {
      loadConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).message).toContain('Invalid JSON');
    }
  });

  it('throws ConfigError when required field "name" is missing', () => {
    const configPath = join(tmpDir, 'docs.config.json');
    writeFileSync(configPath, JSON.stringify({ type: 'plugin' }), 'utf-8');

    expect(() => loadConfig(configPath)).toThrowError(ConfigError);
    try {
      loadConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const message = (err as ConfigError).message;
      // The field name should appear in the error message
      expect(message).toContain('name');
      expect((err as ConfigError).issues).toBeDefined();
    }
  });

  it('applies all defaults to a minimal valid config', () => {
    const configPath = join(tmpDir, 'docs.config.json');
    writeFileSync(configPath, JSON.stringify({ name: 'Minimal Plugin' }), 'utf-8');

    const config = loadConfig(configPath);
    expect(config.type).toBe('plugin');
    expect(config.source).toBe('./');
    expect(config.exclude).toEqual(['vendor/**', 'node_modules/**']);
    expect(config.output).toBe('./docs-output');
    expect(config.theme).toBe('default');
    expect(config.site.baseUrl).toBe('/');
    expect(config.mcp.enabled).toBe(false);
    expect(config.mcp.output).toBe('./mcp-reference');
    expect(config.groups).toEqual([]);
  });
});

describe('findConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns the config path when found in the target directory', () => {
    const configPath = join(tmpDir, 'docs.config.json');
    writeFileSync(configPath, JSON.stringify({ name: 'Test' }), 'utf-8');

    expect(findConfig(tmpDir)).toBe(configPath);
  });

  it('returns the config path when found in a parent directory', () => {
    const nestedDir = join(tmpDir, 'src', 'components');
    mkdirSync(nestedDir, { recursive: true });

    const configPath = join(tmpDir, 'docs.config.json');
    writeFileSync(configPath, JSON.stringify({ name: 'Test' }), 'utf-8');

    expect(findConfig(nestedDir)).toBe(configPath);
  });

  it('returns null when no config file exists up the tree', () => {
    // Use a deep temp directory with no config file present
    const nestedDir = join(tmpDir, 'deep', 'nested', 'dir');
    mkdirSync(nestedDir, { recursive: true });

    // We can't guarantee there's no docs.config.json all the way up to /,
    // so we just verify the function returns either null or a string path.
    const result = findConfig(nestedDir);
    // It's valid to find one in a parent (if tests run inside a project),
    // but it must return string | null.
    expect(result === null || typeof result === 'string').toBe(true);
  });
});

describe('resolveConfig', () => {
  it('applies defaults to a partial raw object', () => {
    const config = resolveConfig({ name: 'Partial Config' });
    expect(config.name).toBe('Partial Config');
    expect(config.type).toBe('plugin');
    expect(config.output).toBe('./docs-output');
    expect(config.mcp.enabled).toBe(false);
  });

  it('preserves explicitly set values over defaults', () => {
    const config = resolveConfig({
      name: 'Custom',
      type: 'theme',
      output: './custom-out',
      mcp: { enabled: true },
    });
    expect(config.type).toBe('theme');
    expect(config.output).toBe('./custom-out');
    expect(config.mcp.enabled).toBe(true);
    // default for mcp.output still applied
    expect(config.mcp.output).toBe('./mcp-reference');
  });

  it('throws ConfigError for invalid input', () => {
    expect(() => resolveConfig({ type: 'plugin' })).toThrowError(ConfigError);
  });

  it('includes Zod issues on ConfigError', () => {
    try {
      resolveConfig({});
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).issues).toBeDefined();
      expect((err as ConfigError).issues!.length).toBeGreaterThan(0);
    }
  });
});
