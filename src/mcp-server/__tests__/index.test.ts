import { describe, it, expect } from 'vitest';
import { handleRequest } from '../index.js';
import type { McpReference } from '../../generator/mcp/types.js';

// ── Minimal stub reference for testing ──────────────────────────────────────

function makeRef(overrides: Partial<McpReference> = {}): McpReference {
  return {
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    functions: [
      {
        name: 'my_function',
        description: 'Does something useful',
        params: [{ name: 'id', type: 'int', description: 'Post ID', optional: false }],
        returns: { type: 'bool', description: 'Success' },
        since: '1.0.0',
        deprecated: null,
        file: 'plugin.php',
        line: 10,
      },
    ],
    classes: [
      {
        name: 'My_Class',
        description: 'Main plugin class',
        extends: null,
        implements: [],
        isAbstract: false,
        isFinal: false,
        isInterface: false,
        isTrait: false,
        since: null,
        methods: [],
        properties: [],
        constants: [],
        file: 'class.php',
        line: 1,
      },
    ],
    constants: [
      {
        name: 'MY_VERSION',
        value: '1.0.0',
        description: 'Plugin version',
        file: 'plugin.php',
        line: 3,
      },
    ],
    hooks: {
      actions: [
        {
          name: 'my_plugin_init',
          type: 'action',
          usage: 'dispatch',
          description: 'Fires on plugin init',
          priority: null,
          acceptedArgs: null,
          dispatchArgCount: 0,
          file: 'plugin.php',
          line: 20,
        },
      ],
      filters: [
        {
          name: 'my_plugin_filter',
          type: 'filter',
          usage: 'dispatch',
          description: 'Filters some value',
          priority: null,
          acceptedArgs: null,
          dispatchArgCount: 1,
          file: 'plugin.php',
          line: 30,
        },
      ],
    },
    js: { functions: [] },
    cssTokens: [],
    ...overrides,
  };
}

const ref = makeRef();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('handleRequest — GET /', () => {
  it('returns 200 with metadata and endpoints list', () => {
    const result = handleRequest('GET', '/', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    expect(body.name).toBe('Test Plugin');
    expect(body.version).toBe('1.0.0');
    expect(body.description).toBe('A test plugin');
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect((body.endpoints as string[]).length).toBeGreaterThan(0);
  });
});

describe('handleRequest — GET /functions', () => {
  it('returns functions array', () => {
    const result = handleRequest('GET', '/functions', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { functions: unknown[] };
    expect(Array.isArray(body.functions)).toBe(true);
    expect(body.functions.length).toBe(1);
  });
});

describe('handleRequest — GET /functions/:name', () => {
  it('returns single function when name exists', () => {
    const result = handleRequest('GET', '/functions/my_function', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { name: string };
    expect(body.name).toBe('my_function');
  });

  it('returns 404 when function not found', () => {
    const result = handleRequest('GET', '/functions/nonexistent', new URLSearchParams(), ref);
    expect(result.status).toBe(404);
  });
});

describe('handleRequest — GET /hooks', () => {
  it('returns both actions and filters', () => {
    const result = handleRequest('GET', '/hooks', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { actions: unknown[]; filters: unknown[] };
    expect(Array.isArray(body.actions)).toBe(true);
    expect(Array.isArray(body.filters)).toBe(true);
    expect(body.actions.length).toBe(1);
    expect(body.filters.length).toBe(1);
  });
});

describe('handleRequest — GET /hooks/actions', () => {
  it('returns only actions', () => {
    const result = handleRequest('GET', '/hooks/actions', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { actions: unknown[] };
    expect(Array.isArray(body.actions)).toBe(true);
    expect(body.actions.length).toBe(1);
    expect((body as Record<string, unknown>).filters).toBeUndefined();
  });
});

describe('handleRequest — GET /hooks/filters', () => {
  it('returns only filters', () => {
    const result = handleRequest('GET', '/hooks/filters', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { filters: unknown[] };
    expect(Array.isArray(body.filters)).toBe(true);
    expect(body.filters.length).toBe(1);
    expect((body as Record<string, unknown>).actions).toBeUndefined();
  });
});

describe('handleRequest — GET /hooks/:name', () => {
  it('returns single action hook by name', () => {
    const result = handleRequest('GET', '/hooks/my_plugin_init', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { name: string };
    expect(body.name).toBe('my_plugin_init');
  });

  it('returns single filter hook by name', () => {
    const result = handleRequest('GET', '/hooks/my_plugin_filter', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { name: string; type: string };
    expect(body.name).toBe('my_plugin_filter');
    expect(body.type).toBe('filter');
  });

  it('returns 404 for missing hook', () => {
    const result = handleRequest('GET', '/hooks/does_not_exist', new URLSearchParams(), ref);
    expect(result.status).toBe(404);
  });
});

describe('handleRequest — GET /classes', () => {
  it('returns classes array', () => {
    const result = handleRequest('GET', '/classes', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { classes: unknown[] };
    expect(Array.isArray(body.classes)).toBe(true);
    expect(body.classes.length).toBe(1);
  });
});

describe('handleRequest — GET /classes/:name', () => {
  it('returns single class by name', () => {
    const result = handleRequest('GET', '/classes/My_Class', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { name: string };
    expect(body.name).toBe('My_Class');
  });

  it('returns 404 for missing class', () => {
    const result = handleRequest('GET', '/classes/Nope', new URLSearchParams(), ref);
    expect(result.status).toBe(404);
  });
});

describe('handleRequest — GET /constants', () => {
  it('returns constants array', () => {
    const result = handleRequest('GET', '/constants', new URLSearchParams(), ref);
    expect(result.status).toBe(200);
    const body = result.body as { constants: unknown[] };
    expect(Array.isArray(body.constants)).toBe(true);
    expect(body.constants.length).toBe(1);
  });
});

describe('handleRequest — GET /search', () => {
  it('returns matching items for known term', () => {
    const q = new URLSearchParams({ q: 'my_function' });
    const result = handleRequest('GET', '/search', q, ref);
    expect(result.status).toBe(200);
    const body = result.body as { results: Array<{ kind: string; item: { name: string } }> };
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]!.item.name).toBe('my_function');
  });

  it('matches by name prefix', () => {
    const q = new URLSearchParams({ q: 'my_func' });
    const result = handleRequest('GET', '/search', q, ref);
    const body = result.body as { results: unknown[] };
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('matches by partial description', () => {
    const q = new URLSearchParams({ q: 'useful' });
    const result = handleRequest('GET', '/search', q, ref);
    const body = result.body as { results: Array<{ kind: string }> };
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]!.kind).toBe('function');
  });

  it('returns empty results for unknown term', () => {
    const q = new URLSearchParams({ q: 'zzznomatch999' });
    const result = handleRequest('GET', '/search', q, ref);
    const body = result.body as { results: unknown[] };
    expect(body.results.length).toBe(0);
  });
});

describe('handleRequest — error cases', () => {
  it('returns 404 for unknown route', () => {
    const result = handleRequest('GET', '/unknown', new URLSearchParams(), ref);
    expect(result.status).toBe(404);
  });

  it('returns 405 for non-GET method', () => {
    const result = handleRequest('POST', '/', new URLSearchParams(), ref);
    expect(result.status).toBe(405);
  });

  it('returns 405 for DELETE method', () => {
    const result = handleRequest('DELETE', '/functions', new URLSearchParams(), ref);
    expect(result.status).toBe(405);
  });
});
