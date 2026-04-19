import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildMcpReference } from '../index.js';
import { parseTarget } from '../../../parser/index.js';
import { resolveConfig } from '../../../config/loader.js';
import type { McpReference } from '../types.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const examplePlugin = resolve(__dir, '../../../../examples/example-plugin');

let ref: McpReference;

beforeAll(async () => {
  const config = resolveConfig({
    name: 'Example Plugin',
    type: 'plugin',
    source: examplePlugin,
  });
  const parsed = await parseTarget(config);
  ref = buildMcpReference(parsed);
});

describe('buildMcpReference — metadata', () => {
  it('sets name from plugin header', () => {
    expect(ref.name).toBeTruthy();
  });

  it('sets version', () => {
    expect(ref.version).toBeTruthy();
  });

  it('sets description', () => {
    expect(ref.description).toBeTruthy();
  });
});

describe('buildMcpReference — PHP functions', () => {
  it('includes top-level PHP functions', () => {
    expect(ref.functions.length).toBeGreaterThan(0);
  });

  it('function has name, file, line', () => {
    const fn = ref.functions[0]!;
    expect(fn.name).toBeTruthy();
    expect(fn.file).toBeTruthy();
    expect(fn.line).toBeGreaterThan(0);
  });

  it('documented function has description', () => {
    const fn = ref.functions.find((f) => f.description);
    expect(fn).toBeDefined();
  });

  it('includes @since', () => {
    const fn = ref.functions.find((f) => f.since);
    expect(fn).toBeDefined();
    expect(fn!.since).toBeTruthy();
  });

  it('includes params from PHPDoc', () => {
    const fn = ref.functions.find((f) => f.params.length > 0);
    expect(fn).toBeDefined();
  });
});

describe('buildMcpReference — PHP classes', () => {
  it('includes PHP classes', () => {
    expect(ref.classes.length).toBeGreaterThan(0);
  });

  it('class has methods', () => {
    const cls = ref.classes.find((c) => c.methods.length > 0);
    expect(cls).toBeDefined();
  });

  it('class has extends/implements', () => {
    // Example_Plugin class exists
    const cls = ref.classes.find((c) => c.name === 'Example_Plugin');
    expect(cls).toBeDefined();
  });

  it('method has visibility', () => {
    const cls = ref.classes[0]!;
    if (cls.methods.length > 0) {
      expect(['public', 'protected', 'private']).toContain(cls.methods[0]!.visibility);
    }
  });
});

describe('buildMcpReference — constants', () => {
  it('includes PHP constants from define()', () => {
    const names = ref.constants.map((c) => c.name);
    expect(names).toContain('EXAMPLE_PLUGIN_VERSION');
  });

  it('constant has value', () => {
    const c = ref.constants.find((c) => c.name === 'EXAMPLE_PLUGIN_VERSION');
    expect(c?.value).toBeTruthy();
  });
});

describe('buildMcpReference — hooks', () => {
  it('includes actions', () => {
    expect(ref.hooks.actions.length).toBeGreaterThan(0);
  });

  it('includes filters', () => {
    expect(ref.hooks.filters.length).toBeGreaterThan(0);
  });

  it('hook has name, file, line', () => {
    const hook = ref.hooks.actions[0]!;
    expect(hook.name).toBeTruthy();
    expect(hook.file).toBeTruthy();
    expect(hook.line).toBeGreaterThan(0);
  });

  it('dispatch hooks have description from PHPDoc', () => {
    const hook = ref.hooks.actions[0]!;
    expect(typeof hook.description).toBe('string');
  });
});

describe('buildMcpReference — CSS tokens', () => {
  it('includes CSS custom properties', () => {
    expect(ref.cssTokens.length).toBeGreaterThan(0);
  });

  it('token has name, value, scope', () => {
    const token = ref.cssTokens[0]!;
    expect(token.name).toMatch(/^--/);
    expect(token.value).toBeTruthy();
    expect(token.scope).toBeTruthy();
  });
});

describe('buildMcpReference — shape', () => {
  it('has all required top-level keys', () => {
    expect(ref).toHaveProperty('name');
    expect(ref).toHaveProperty('functions');
    expect(ref).toHaveProperty('classes');
    expect(ref).toHaveProperty('constants');
    expect(ref).toHaveProperty('hooks');
    expect(ref).toHaveProperty('hooks.actions');
    expect(ref).toHaveProperty('hooks.filters');
    expect(ref).toHaveProperty('restFields');
    expect(ref).toHaveProperty('js');
    expect(ref).toHaveProperty('cssTokens');
  });

  it('is JSON-serializable', () => {
    expect(() => JSON.stringify(ref)).not.toThrow();
  });
});
