import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { parse } from '@babel/parser';
import type { File } from '@babel/types';
import { extractWpApis } from '../wp-apis.js';
import { parseJsFile } from '../index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

function parseFixture(name: string): File {
  const source = readFileSync(fixture(name), 'utf8');
  return parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    attachComment: true,
  });
}

// ─── wp.hooks tests ───────────────────────────────────────────────────────────

describe('extractWpApis — wp.hooks.addAction', () => {
  it('detects addAction with hook name and namespace', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const actions = result.hooks.filter((h) => h.type === 'addAction');
    expect(actions.length).toBeGreaterThanOrEqual(1);
    const first = actions[0]!;
    expect(first.hookName).toBe('myplugin.init');
    expect(first.namespace).toBe('my-plugin');
  });

  it('detects addAction with optional priority', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const withPriority = result.hooks.find(
      (h) => h.type === 'addAction' && h.hookName === 'myplugin.save'
    );
    expect(withPriority).toBeDefined();
    expect(withPriority!.priority).toBe(20);
  });

  it('addAction without priority has undefined priority', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const noPriority = result.hooks.find(
      (h) => h.type === 'addAction' && h.hookName === 'myplugin.init'
    );
    expect(noPriority).toBeDefined();
    expect(noPriority!.priority).toBeUndefined();
  });

  it('records correct file path for addAction', () => {
    const filePath = fixture('wp-apis.js');
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, filePath);
    const action = result.hooks.find((h) => h.type === 'addAction');
    expect(action!.file).toBe(filePath);
  });

  it('records correct line number for addAction', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const action = result.hooks.find(
      (h) => h.type === 'addAction' && h.hookName === 'myplugin.init'
    );
    expect(action!.line).toBeGreaterThan(0);
  });
});

describe('extractWpApis — wp.hooks.addFilter', () => {
  it('detects addFilter with hook name and namespace', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const filter = result.hooks.find(
      (h) => h.type === 'addFilter' && h.hookName === 'myplugin.settings'
    );
    expect(filter).toBeDefined();
    expect(filter!.namespace).toBe('my-plugin');
  });

  it('detects addFilter with optional priority', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const withPriority = result.hooks.find(
      (h) => h.type === 'addFilter' && h.hookName === 'myplugin.output'
    );
    expect(withPriority).toBeDefined();
    expect(withPriority!.priority).toBe(5);
  });

  it('addFilter without priority has undefined priority', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const noPriority = result.hooks.find(
      (h) => h.type === 'addFilter' && h.hookName === 'myplugin.settings'
    );
    expect(noPriority!.priority).toBeUndefined();
  });
});

describe('extractWpApis — wp.hooks.doAction', () => {
  it('detects doAction with hook name', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const doAction = result.hooks.find((h) => h.type === 'doAction');
    expect(doAction).toBeDefined();
    expect(doAction!.hookName).toBe('myplugin.rendered');
  });

  it('doAction has no namespace', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const doAction = result.hooks.find((h) => h.type === 'doAction');
    expect(doAction!.namespace).toBeUndefined();
  });

  it('records correct line for doAction', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const doAction = result.hooks.find((h) => h.type === 'doAction');
    expect(doAction!.line).toBeGreaterThan(0);
  });
});

describe('extractWpApis — wp.hooks.applyFilters', () => {
  it('detects applyFilters with hook name', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const applyFilters = result.hooks.find((h) => h.type === 'applyFilters');
    expect(applyFilters).toBeDefined();
    expect(applyFilters!.hookName).toBe('myplugin.value');
  });

  it('applyFilters has no namespace', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const applyFilters = result.hooks.find((h) => h.type === 'applyFilters');
    expect(applyFilters!.namespace).toBeUndefined();
  });
});

// ─── wp.data tests ────────────────────────────────────────────────────────────

describe('extractWpApis — wp.data.select', () => {
  it('detects select with store name', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const select = result.data.find((d) => d.type === 'select');
    expect(select).toBeDefined();
    expect(select!.store).toBe('core/editor');
  });

  it('records correct file path for select', () => {
    const filePath = fixture('wp-apis.js');
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, filePath);
    const select = result.data.find((d) => d.type === 'select');
    expect(select!.file).toBe(filePath);
  });

  it('records correct line for select', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const select = result.data.find((d) => d.type === 'select');
    expect(select!.line).toBeGreaterThan(0);
  });
});

describe('extractWpApis — wp.data.dispatch', () => {
  it('detects dispatch with store name', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const dispatch = result.data.find((d) => d.type === 'dispatch');
    expect(dispatch).toBeDefined();
    expect(dispatch!.store).toBe('core/notices');
  });
});

describe('extractWpApis — wp.data.subscribe', () => {
  it('detects subscribe call', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const subscribe = result.data.find((d) => d.type === 'subscribe');
    expect(subscribe).toBeDefined();
  });

  it('subscribe has no store', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const subscribe = result.data.find((d) => d.type === 'subscribe');
    expect(subscribe!.store).toBeUndefined();
  });
});

// ─── registerBlockType tests ──────────────────────────────────────────────────

describe('extractWpApis — registerBlockType', () => {
  it('detects registerBlockType with block name', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const block = result.blocks.find((b) => b.blockName === 'my-plugin/my-block');
    expect(block).toBeDefined();
  });

  it('detects multiple registerBlockType calls', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    expect(result.blocks).toHaveLength(2);
  });

  it('captures second block name correctly', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const hero = result.blocks.find((b) => b.blockName === 'my-plugin/hero-block');
    expect(hero).toBeDefined();
  });

  it('records correct line for block registration', () => {
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, fixture('wp-apis.js'));
    const block = result.blocks[0]!;
    expect(block.line).toBeGreaterThan(0);
  });

  it('records correct file path for block registration', () => {
    const filePath = fixture('wp-apis.js');
    const ast = parseFixture('wp-apis.js');
    const result = extractWpApis(ast, filePath);
    expect(result.blocks[0]!.file).toBe(filePath);
  });
});

// ─── Empty file ───────────────────────────────────────────────────────────────

describe('extractWpApis — no WP APIs present', () => {
  it('returns empty hooks array for non-WP file', () => {
    const ast = parseFixture('functions.js');
    const result = extractWpApis(ast, fixture('functions.js'));
    expect(result.hooks).toHaveLength(0);
  });

  it('returns empty data array for non-WP file', () => {
    const ast = parseFixture('functions.js');
    const result = extractWpApis(ast, fixture('functions.js'));
    expect(result.data).toHaveLength(0);
  });

  it('returns empty blocks array for non-WP file', () => {
    const ast = parseFixture('functions.js');
    const result = extractWpApis(ast, fixture('functions.js'));
    expect(result.blocks).toHaveLength(0);
  });
});

// ─── Integration: parseJsFile includes wpApis ─────────────────────────────────

describe('parseJsFile — wpApis integration', () => {
  it('parseJsFile includes wpApis field', () => {
    const result = parseJsFile(fixture('wp-apis.js'));
    expect(result.wpApis).toBeDefined();
  });

  it('parseJsFile wpApis contains hooks', () => {
    const result = parseJsFile(fixture('wp-apis.js'));
    expect(result.wpApis!.hooks.length).toBeGreaterThan(0);
  });

  it('parseJsFile wpApis contains data usages', () => {
    const result = parseJsFile(fixture('wp-apis.js'));
    expect(result.wpApis!.data.length).toBeGreaterThan(0);
  });

  it('parseJsFile wpApis contains block registrations', () => {
    const result = parseJsFile(fixture('wp-apis.js'));
    expect(result.wpApis!.blocks.length).toBeGreaterThan(0);
  });

  it('parseJsFile wpApis is empty for non-WP file', () => {
    const result = parseJsFile(fixture('functions.js'));
    expect(result.wpApis!.hooks).toHaveLength(0);
    expect(result.wpApis!.data).toHaveLength(0);
    expect(result.wpApis!.blocks).toHaveLength(0);
  });
});

// ─── admin.js fixture (real-world WP usage) ───────────────────────────────────

describe('extractWpApis — admin.js fixture', () => {
  const adminFixture = resolve(__dir, '../../../../examples/example-plugin/assets/js/admin.js');

  it('detects addAction in admin.js', () => {
    const result = parseJsFile(adminFixture);
    const actions = result.wpApis!.hooks.filter((h) => h.type === 'addAction');
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[0]!.hookName).toBe('example_plugin.init');
  });

  it('detects addFilter in admin.js', () => {
    const result = parseJsFile(adminFixture);
    const filters = result.wpApis!.hooks.filter((h) => h.type === 'addFilter');
    expect(filters.length).toBeGreaterThanOrEqual(1);
    expect(filters[0]!.hookName).toBe('example_plugin.settings');
  });

  it('detects applyFilters in admin.js', () => {
    const result = parseJsFile(adminFixture);
    const applyFilters = result.wpApis!.hooks.filter((h) => h.type === 'applyFilters');
    expect(applyFilters.length).toBeGreaterThanOrEqual(1);
    expect(applyFilters[0]!.hookName).toBe('example_plugin.settings');
  });

  it('detects doAction in admin.js', () => {
    const result = parseJsFile(adminFixture);
    const doActions = result.wpApis!.hooks.filter((h) => h.type === 'doAction');
    expect(doActions.length).toBeGreaterThanOrEqual(1);
    expect(doActions[0]!.hookName).toBe('example_plugin.init');
  });
});
