import { describe, it, expect } from 'vitest';
import { mergeOverrides } from '../merge.js';
import type { McpReference } from '../../generator/mcp/types.js';
import type { OverridesFile } from '../schema.js';

/** Minimal reference factory — only the fields merge touches. */
function makeReference(overrides: Partial<McpReference> = {}): McpReference {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test',
    type: 'plugin',
    functions: [],
    classes: [],
    constants: [],
    hooks: { actions: [], filters: [] },
    restEndpoints: [],
    restFields: [],
    js: { functions: [], globalObjects: [] },
    cssTokens: [],
    ...overrides,
  };
}

describe('mergeOverrides', () => {
  // ─── Basic matching ───────────────────────────────────────────────────────

  it('attaches overrides to matching functions by name', () => {
    const ref = makeReference({
      functions: [
        {
          name: 'my_func',
          description: '',
          params: [],
          returns: null,
          since: null,
          deprecated: null,
          file: 'f.php',
          line: 1,
        },
      ] as McpReference['functions'],
    });
    const overrides: OverridesFile = {
      functions: {
        my_func: [{ type: 'tip', content: 'hello', variant: 'info' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.functions[0] as Record<string, unknown>).overrides).toEqual([
      { type: 'tip', content: 'hello', variant: 'info' },
    ]);
  });

  it('matches case-insensitively', () => {
    const ref = makeReference({
      functions: [
        {
          name: 'My_Function',
          description: '',
          params: [],
          returns: null,
          since: null,
          deprecated: null,
          file: 'f.php',
          line: 1,
        },
      ] as McpReference['functions'],
    });
    const overrides: OverridesFile = {
      functions: {
        my_function: [{ type: 'code', content: 'echo 1;', language: 'php' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.functions[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  // ─── Unmatched targets ──────────────────────────────────────────────────

  it('returns warning for unmatched override target', () => {
    const ref = makeReference();
    const overrides: OverridesFile = {
      functions: {
        nonexistent_func: [{ type: 'tip', content: 'gone', variant: 'warning' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('nonexistent_func');
    expect(warnings[0]).toContain('functions');
  });

  // ─── All categories ───────────────────────────────────────────────────────

  it('merges overrides for actions and filters', () => {
    const ref = makeReference({
      hooks: {
        actions: [
          {
            name: 'my_action',
            type: 'action',
            description: '',
            params: [],
            since: null,
            deprecated: null,
            dispatchArgCount: 1,
            file: 'a.php',
            line: 1,
          },
        ] as McpReference['hooks']['actions'],
        filters: [
          {
            name: 'my_filter',
            type: 'filter',
            description: '',
            params: [],
            since: null,
            deprecated: null,
            dispatchArgCount: 1,
            file: 'f.php',
            line: 1,
          },
        ] as McpReference['hooks']['filters'],
      },
    });
    const overrides: OverridesFile = {
      actions: {
        my_action: [{ type: 'tip', content: 'action tip', variant: 'success' }],
      },
      filters: {
        my_filter: [{ type: 'code', content: 'return $val;', language: 'php' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.hooks.actions[0] as Record<string, unknown>).overrides).toHaveLength(1);
    expect((ref.hooks.filters[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  it('merges overrides for REST endpoints by fullRoute', () => {
    const ref = makeReference({
      restEndpoints: [
        {
          namespace: 'ns/v1',
          route: '/items',
          fullRoute: 'ns/v1/items',
          methods: ['GET'],
          description: '',
          file: 'r.php',
          line: 1,
        },
      ] as McpReference['restEndpoints'],
    });
    const overrides: OverridesFile = {
      restEndpoints: {
        'ns/v1/items': [{ type: 'tip', content: 'endpoint tip', variant: 'info' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.restEndpoints[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  it('merges overrides for constants', () => {
    const ref = makeReference({
      constants: [
        { name: 'MY_CONST', value: '42', description: '', file: 'c.php', line: 1 },
      ] as McpReference['constants'],
    });
    const overrides: OverridesFile = {
      constants: {
        MY_CONST: [{ type: 'tip', content: 'const tip', variant: 'info' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.constants[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  it('merges overrides for classes', () => {
    const ref = makeReference({
      classes: [
        {
          name: 'My_Class',
          description: '',
          extends: null,
          implements: [],
          isAbstract: false,
          isFinal: false,
          isInterface: false,
          isTrait: false,
          properties: [],
          methods: [],
          since: null,
          file: 'c.php',
          line: 1,
        },
      ] as McpReference['classes'],
    });
    const overrides: OverridesFile = {
      classes: {
        My_Class: [{ type: 'code', content: 'new My_Class();', language: 'php' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.classes[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  it('merges overrides for JS functions', () => {
    const ref = makeReference({
      js: {
        functions: [
          {
            name: 'initApp',
            description: '',
            params: [],
            returns: null,
            since: null,
            deprecated: null,
            file: 'app.js',
            line: 1,
          },
        ] as McpReference['js']['functions'],
        globalObjects: [],
      },
    });
    const overrides: OverridesFile = {
      js: {
        initApp: [{ type: 'tip', content: 'js tip', variant: 'info' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.js.functions[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  it('merges overrides for CSS tokens', () => {
    const ref = makeReference({
      cssTokens: [
        {
          name: '--my-color',
          value: '#fff',
          description: '',
          scope: ':root',
          file: 's.css',
          line: 1,
        },
      ] as McpReference['cssTokens'],
    });
    const overrides: OverridesFile = {
      cssTokens: {
        '--my-color': [{ type: 'tip', content: 'css tip', variant: 'info' }],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.cssTokens[0] as Record<string, unknown>).overrides).toHaveLength(1);
  });

  // ─── Multiple blocks per item ─────────────────────────────────────────────

  it('attaches multiple override blocks to a single item', () => {
    const ref = makeReference({
      functions: [
        {
          name: 'multi',
          description: '',
          params: [],
          returns: null,
          since: null,
          deprecated: null,
          file: 'f.php',
          line: 1,
        },
      ] as McpReference['functions'],
    });
    const overrides: OverridesFile = {
      functions: {
        multi: [
          { type: 'tip', content: 'tip one', variant: 'info' },
          { type: 'code', content: 'echo 1;', language: 'php' },
          { type: 'tip', content: 'tip two', variant: 'warning' },
        ],
      },
    };

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.functions[0] as Record<string, unknown>).overrides).toHaveLength(3);
  });

  // ─── Empty overrides ─────────────────────────────────────────────────────

  it('handles empty overrides file gracefully', () => {
    const ref = makeReference({
      functions: [
        {
          name: 'fn',
          description: '',
          params: [],
          returns: null,
          since: null,
          deprecated: null,
          file: 'f.php',
          line: 1,
        },
      ] as McpReference['functions'],
    });
    const overrides: OverridesFile = {};

    const warnings = mergeOverrides(ref, overrides);

    expect(warnings).toHaveLength(0);
    expect((ref.functions[0] as Record<string, unknown>).overrides).toBeUndefined();
  });
});
