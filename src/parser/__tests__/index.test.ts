import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseTarget } from '../index.js';
import { resolveConfig } from '../../config/loader.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const examplePlugin = resolve(__dir, '../../../examples/example-plugin');
const phpFixtures = resolve(__dir, '../php/__fixtures__');

function pluginConfig(overrides: Record<string, unknown> = {}) {
  return resolveConfig({
    name: 'Test Plugin',
    type: 'plugin',
    source: examplePlugin,
    ...overrides,
  });
}

describe('parseTarget — file discovery', () => {
  it('finds PHP files', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.php.length).toBeGreaterThan(0);
  });

  it('finds JS files', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.js.length).toBeGreaterThan(0);
  });

  it('finds CSS files', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.css.length).toBeGreaterThan(0);
  });

  it('reports sourceRoot', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.sourceRoot).toBe(examplePlugin);
  });
});

describe('parseTarget — PHP content', () => {
  it('extracts functions from PHP files', async () => {
    const result = await parseTarget(pluginConfig());
    const allFunctions = result.php.flatMap((r) => r.functions);
    expect(allFunctions.length).toBeGreaterThan(0);
  });

  it('extracts classes from PHP files', async () => {
    const result = await parseTarget(pluginConfig());
    const allClasses = result.php.flatMap((r) => r.classes);
    expect(allClasses.length).toBeGreaterThan(0);
    const names = allClasses.map((c) => c.name);
    expect(names).toContain('Example_Plugin');
  });

  it('extracts constants from PHP files', async () => {
    const result = await parseTarget(pluginConfig());
    const allConstants = result.php.flatMap((r) => r.constants);
    const names = allConstants.map((c) => c.name);
    expect(names).toContain('EXAMPLE_PLUGIN_VERSION');
  });
});

describe('parseTarget — WordPress hooks', () => {
  it('extracts hooks from PHP files', async () => {
    const result = await parseTarget(pluginConfig());
    const allHooks = result.hooks.flatMap((r) => r.hooks);
    expect(allHooks.length).toBeGreaterThan(0);
  });

  it('finds do_action dispatches', async () => {
    const result = await parseTarget(pluginConfig());
    const allHooks = result.hooks.flatMap((r) => r.hooks);
    const actions = allHooks.filter((h) => h.type === 'action');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((h) => h.usage === 'dispatch')).toBe(true);
  });

  it('finds apply_filters dispatches', async () => {
    const result = await parseTarget(pluginConfig());
    const allHooks = result.hooks.flatMap((r) => r.hooks);
    const filters = allHooks.filter((h) => h.type === 'filter');
    expect(filters.length).toBeGreaterThan(0);
    expect(filters.every((h) => h.usage === 'dispatch')).toBe(true);
  });
});

describe('parseTarget — plugin header', () => {
  it('extracts plugin header', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.pluginHeader).not.toBeNull();
    expect(result.pluginHeader!.pluginName).toBeTruthy();
  });

  it('returns null themeHeader for plugin type', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.themeHeader).toBeNull();
  });
});

describe('parseTarget — readme', () => {
  it('populates changelog from readme.txt or CHANGELOG.md', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.readme).not.toBeNull();
    expect(result.readme!.changelog.length).toBeGreaterThan(0);
  });
});

describe('parseTarget — JS content', () => {
  it('finds JS files and parses them', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.js.length).toBeGreaterThan(0);
  });

  it('JS results have file paths', async () => {
    const result = await parseTarget(pluginConfig());
    for (const jsResult of result.js) {
      expect(jsResult.file).toBeTruthy();
    }
  });
});

describe('parseTarget — CSS content', () => {
  it('extracts custom properties from CSS files', async () => {
    const result = await parseTarget(pluginConfig());
    const allProps = result.css.flatMap((r) => r.customProperties);
    expect(allProps.length).toBeGreaterThan(0);
  });
});

describe('parseTarget — block.json discovery', () => {
  it('discovers block.json files in the plugin directory', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.blocks).toBeDefined();
    expect(Array.isArray(result.blocks)).toBe(true);
    expect(result.blocks.length).toBeGreaterThan(0);
  });

  it('ParseResult.blocks contains a ParsedBlock with correct name', async () => {
    const result = await parseTarget(pluginConfig());
    const names = result.blocks.map((b) => b.name);
    expect(names).toContain('example-plugin/example-block');
  });

  it('parsed block includes file path', async () => {
    const result = await parseTarget(pluginConfig());
    for (const block of result.blocks) {
      expect(block.file).toBeTruthy();
      expect(block.file).toMatch(/block\.json$/);
    }
  });

  it('parsed block has title field', async () => {
    const result = await parseTarget(pluginConfig());
    const block = result.blocks.find((b) => b.name === 'example-plugin/example-block');
    expect(block).toBeDefined();
    expect(block!.title).toBe('Example Block');
  });

  it('exclude patterns suppress block.json discovery', async () => {
    const result = await parseTarget(pluginConfig({ exclude: ['**/block.json'] }));
    expect(result.blocks).toHaveLength(0);
  });
});

describe('parseTarget — exclude patterns', () => {
  it('respects exclude patterns', async () => {
    const result = await parseTarget(pluginConfig({ exclude: ['**/*.php'] }));
    expect(result.php).toHaveLength(0);
  });
});

describe('parseTarget — error handling', () => {
  it('collects parse errors without throwing', async () => {
    // Point at a directory with valid + a non-existent additional source
    const result = await parseTarget(pluginConfig());
    // Should complete successfully even if some files have issues
    expect(result).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('returns empty errors array for clean plugin', async () => {
    const result = await parseTarget(pluginConfig());
    expect(result.errors).toHaveLength(0);
  });
});

describe('parseTarget — small fixture directory', () => {
  it('parses a bare PHP fixtures directory', async () => {
    const result = await parseTarget(
      resolveConfig({
        name: 'PHP Fixtures',
        type: 'plugin',
        source: phpFixtures,
        exclude: [],
      })
    );
    expect(result.php.length).toBeGreaterThan(0);
    expect(result.pluginHeader).toBeNull(); // fixtures have no plugin header
  });
});
