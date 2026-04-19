import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { loadOverrides } from '../loader.js';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `wpdocs-overrides-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('loadOverrides', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── Auto-discovery ────────────────────────────────────────────────���────────

  it('returns null when no overrides file exists', () => {
    expect(loadOverrides(tmpDir)).toBeNull();
  });

  it('auto-discovers overrides.yaml', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yaml'),
      'functions:\n  my_func:\n    - type: tip\n      content: hello\n',
      'utf8'
    );
    const result = loadOverrides(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.functions).toBeDefined();
    expect(result!.functions!['my_func']).toHaveLength(1);
    expect(result!.functions!['my_func'][0].type).toBe('tip');
  });

  it('auto-discovers overrides.yml', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yml'),
      'classes:\n  My_Class:\n    - type: code\n      content: "echo 1;"\n',
      'utf8'
    );
    const result = loadOverrides(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.classes!['My_Class']).toHaveLength(1);
  });

  it('auto-discovers overrides.json', () => {
    writeFileSync(
      join(tmpDir, 'overrides.json'),
      JSON.stringify({
        constants: {
          MY_CONST: [{ type: 'tip', content: 'important' }],
        },
      }),
      'utf8'
    );
    const result = loadOverrides(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.constants!['MY_CONST']).toHaveLength(1);
  });

  it('prefers overrides.yaml over overrides.json', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yaml'),
      'functions:\n  from_yaml:\n    - type: tip\n      content: yaml\n',
      'utf8'
    );
    writeFileSync(
      join(tmpDir, 'overrides.json'),
      JSON.stringify({ functions: { from_json: [{ type: 'tip', content: 'json' }] } }),
      'utf8'
    );
    const result = loadOverrides(tmpDir);
    expect(result!.functions!['from_yaml']).toBeDefined();
    expect(result!.functions!['from_json']).toBeUndefined();
  });

  // ─── Explicit path ──────────────────────────────────────────────────────────

  it('loads from an explicit path', () => {
    const customPath = join(tmpDir, 'custom-overrides.yaml');
    writeFileSync(
      customPath,
      'actions:\n  my_hook:\n    - type: tip\n      content: works\n',
      'utf8'
    );
    const result = loadOverrides(tmpDir, customPath);
    expect(result!.actions!['my_hook']).toHaveLength(1);
  });

  it('throws when explicit path does not exist', () => {
    expect(() => loadOverrides(tmpDir, join(tmpDir, 'missing.yaml'))).toThrow(/not found/);
  });

  // ─── Validation ─────────────────────────────────────────────────────────────

  it('throws on invalid override block type', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yaml'),
      'functions:\n  my_func:\n    - type: invalid\n      content: bad\n',
      'utf8'
    );
    expect(() => loadOverrides(tmpDir)).toThrow(/Invalid overrides file/);
  });

  it('throws when tip block is missing content', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yaml'),
      'functions:\n  my_func:\n    - type: tip\n',
      'utf8'
    );
    expect(() => loadOverrides(tmpDir)).toThrow(/Invalid overrides file/);
  });

  // ─── Block type defaults ──────────────────────────────────────────────────

  it('applies default variant "info" to tip blocks', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yaml'),
      'functions:\n  my_func:\n    - type: tip\n      content: hello\n',
      'utf8'
    );
    const result = loadOverrides(tmpDir);
    const block = result!.functions!['my_func'][0];
    expect(block.type).toBe('tip');
    if (block.type === 'tip') {
      expect(block.variant).toBe('info');
    }
  });

  it('applies default language "php" to code blocks', () => {
    writeFileSync(
      join(tmpDir, 'overrides.yaml'),
      'functions:\n  my_func:\n    - type: code\n      content: "$x = 1;"\n',
      'utf8'
    );
    const result = loadOverrides(tmpDir);
    const block = result!.functions!['my_func'][0];
    expect(block.type).toBe('code');
    if (block.type === 'code') {
      expect(block.language).toBe('php');
    }
  });

  // ─── All categories ─────────────────────────────────────────────────────────

  it('loads all override categories', () => {
    const yaml = `
functions:
  fn1:
    - type: tip
      content: f
classes:
  Cls1:
    - type: tip
      content: c
constants:
  CONST1:
    - type: tip
      content: k
actions:
  act1:
    - type: tip
      content: a
filters:
  filt1:
    - type: tip
      content: fl
restEndpoints:
  ns/v1/route:
    - type: tip
      content: r
js:
  jsFunc:
    - type: tip
      content: j
cssTokens:
  --my-token:
    - type: tip
      content: t
`;
    writeFileSync(join(tmpDir, 'overrides.yaml'), yaml, 'utf8');
    const result = loadOverrides(tmpDir);
    expect(result!.functions).toBeDefined();
    expect(result!.classes).toBeDefined();
    expect(result!.constants).toBeDefined();
    expect(result!.actions).toBeDefined();
    expect(result!.filters).toBeDefined();
    expect(result!.restEndpoints).toBeDefined();
    expect(result!.js).toBeDefined();
    expect(result!.cssTokens).toBeDefined();
  });
});
