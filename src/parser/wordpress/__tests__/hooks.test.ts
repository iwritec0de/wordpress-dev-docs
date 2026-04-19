import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractHooks } from '../hooks.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(__dir, '../__fixtures__', name);

function hooks(file = 'hooks-fixture.php') {
  return extractHooks(fixture(file)).hooks;
}

describe('extractHooks — only captures dispatches', () => {
  it('ignores add_action registrations', () => {
    const found = hooks().filter((h) => h.name === 'init');
    expect(found).toHaveLength(0);
  });

  it('ignores add_filter registrations', () => {
    const found = hooks().filter((h) => h.name === 'the_content');
    expect(found).toHaveLength(0);
  });

  it('ignores nested add_action inside function bodies', () => {
    const found = hooks().filter((h) => h.name === 'save_post');
    expect(found).toHaveLength(0);
  });

  it('ignores class method registrations', () => {
    const wpHead = hooks().filter((h) => h.name === 'wp_head');
    const bodyClass = hooks().filter((h) => h.name === 'body_class');
    expect(wpHead).toHaveLength(0);
    expect(bodyClass).toHaveLength(0);
  });
});

describe('extractHooks — do_action dispatches', () => {
  it('detects do_action with no extra args', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_initialized')!;
    expect(h).toBeDefined();
    expect(h.type).toBe('action');
    expect(h.usage).toBe('dispatch');
    expect(h.dispatchArgCount).toBe(0);
  });

  it('captures dispatch arg count', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_settings_loaded')!;
    expect(h.dispatchArgCount).toBe(2);
  });
});

describe('extractHooks — apply_filters dispatches', () => {
  it('detects apply_filters in assignment', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_content')!;
    expect(h).toBeDefined();
    expect(h.type).toBe('filter');
    expect(h.dispatchArgCount).toBe(1);
  });

  it('detects apply_filters in return statement', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_result')!;
    expect(h).toBeDefined();
    expect(h.dispatchArgCount).toBe(2);
  });

  it('detects apply_filters_ref_array', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_ref_filter')!;
    expect(h).toBeDefined();
    expect(h.type).toBe('filter');
  });

  it('detects apply_filters inside function bodies', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_post_data')!;
    expect(h).toBeDefined();
  });
});

describe('extractHooks — PHPDoc extraction', () => {
  it('extracts description from docblock', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_initialized')!;
    expect(h.description).toBe('Fires after the plugin has finished initializing.');
  });

  it('extracts @since tag', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_initialized')!;
    expect(h.since).toBe('1.0.0');
  });

  it('extracts @param tags', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_settings_loaded')!;
    expect(h.params).toHaveLength(2);
    expect(h.params[0]).toMatchObject({
      name: 'settings',
      type: 'array',
      description: 'The resolved settings array.',
    });
    expect(h.params[1]).toMatchObject({
      name: 'context',
      type: 'string',
      description: 'The context in which settings were loaded.',
    });
  });

  it('extracts params from apply_filters docblock', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_content')!;
    expect(h.params).toHaveLength(1);
    expect(h.params[0]!.name).toBe('raw_content');
  });

  it('returns empty description when no docblock', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_ref_filter')!;
    expect(h.description).toBe('');
    expect(h.since).toBeNull();
    expect(h.params).toHaveLength(0);
  });
});

describe('extractHooks — result structure', () => {
  it('returns file path in result', () => {
    const result = extractHooks(fixture('hooks-fixture.php'));
    expect(result.file).toContain('hooks-fixture.php');
  });

  it('records source location', () => {
    const h = hooks().find((h) => h.name === 'my_plugin_initialized')!;
    expect(h.location.line).toBeGreaterThan(0);
    expect(h.location.file).toContain('hooks-fixture.php');
  });

  it('only contains dispatch hooks (6 total)', () => {
    // 6 dispatch calls in fixture: my_plugin_initialized, my_plugin_settings_loaded,
    // my_plugin_content, my_plugin_result, my_plugin_ref_filter, my_plugin_post_data
    expect(hooks()).toHaveLength(6);
  });
});
