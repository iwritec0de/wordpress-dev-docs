import { describe, it, expect } from 'vitest';
import { buildSearchIndex } from '../search.js';
import { buildNav } from '../nav.js';
import type { McpReference } from '../../mcp/types.js';

function makeRef(overrides: Partial<McpReference> = {}): McpReference {
  return {
    name: 'My Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    functions: [],
    classes: [],
    constants: [],
    hooks: { actions: [], filters: [] },
    js: { functions: [] },
    cssTokens: [],
    restEndpoints: [],
    restFields: [],
    ...overrides,
  };
}

function makeFunction(name: string, description = ''): import('../../mcp/types.js').McpFunction {
  return {
    name,
    description,
    params: [],
    returns: null,
    since: null,
    deprecated: null,
    file: 'plugin.php',
    line: 1,
  };
}

function makeClass(name: string, description = ''): import('../../mcp/types.js').McpClass {
  return {
    name,
    description,
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
    file: 'plugin.php',
    line: 1,
  };
}

function makeHook(
  name: string,
  type: 'action' | 'filter',
  description = ''
): import('../../mcp/types.js').McpHook {
  return {
    name,
    type,
    description,
    since: null,
    dispatchArgCount: null,
    params: [],
    file: 'plugin.php',
    line: 1,
  };
}

function makeCssToken(name: string, value = '#fff'): import('../../mcp/types.js').McpCssToken {
  return {
    name,
    value,
    description: null,
    scope: ':root',
    file: 'style.css',
    line: 1,
  };
}

describe('buildSearchIndex — structure', () => {
  it('returns a SearchIndex with entries array', () => {
    const ref = makeRef();
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    expect(index).toBeDefined();
    expect(Array.isArray(index.entries)).toBe(true);
  });

  it('generatedAt is present and looks like an ISO date', () => {
    const ref = makeRef();
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    expect(index.generatedAt).toBeTruthy();
    expect(new Date(index.generatedAt).toISOString()).toBe(index.generatedAt);
  });
});

describe('buildSearchIndex — page entries', () => {
  it('empty reference still produces page entries from nav', () => {
    const ref = makeRef();
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const pageEntries = index.entries.filter((e) => e.type === 'page');
    expect(pageEntries.length).toBeGreaterThan(0);
  });

  it('page entries have title, href, and description fields', () => {
    const ref = makeRef();
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const pageEntries = index.entries.filter((e) => e.type === 'page');
    for (const entry of pageEntries) {
      expect(entry.title).toBeTruthy();
      expect(entry.href).toBeTruthy();
      expect(typeof entry.description).toBe('string');
    }
  });
});

describe('buildSearchIndex — PHP function entries', () => {
  it('PHP functions appear in entries with type "function"', () => {
    const ref = makeRef({
      functions: [makeFunction('my_function', 'Does something useful')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const fnEntries = index.entries.filter((e) => e.type === 'function');
    expect(fnEntries.length).toBe(1);
    expect(fnEntries[0].title).toBe('my_function');
  });

  it('function entry has correct href pointing to /php/functions', () => {
    const ref = makeRef({ functions: [makeFunction('my_func')] });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const fnEntry = index.entries.find((e) => e.type === 'function' && e.title === 'my_func');
    expect(fnEntry).toBeDefined();
    expect(fnEntry!.href).toContain('/php/functions');
  });

  it('function entry description matches source description', () => {
    const ref = makeRef({
      functions: [makeFunction('fn_with_desc', 'Registers a custom post type')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const fnEntry = index.entries.find((e) => e.title === 'fn_with_desc');
    expect(fnEntry!.description).toBe('Registers a custom post type');
  });
});

describe('buildSearchIndex — hook entries', () => {
  it('hook entries have type "hook"', () => {
    const ref = makeRef({
      hooks: {
        actions: [makeHook('init', 'action')],
        filters: [makeHook('the_content', 'filter')],
      },
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const hookEntries = index.entries.filter((e) => e.type === 'hook');
    expect(hookEntries.length).toBe(2);
  });

  it('action hook entries have tags including "action"', () => {
    const ref = makeRef({
      hooks: { actions: [makeHook('init', 'action')], filters: [] },
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const actionEntry = index.entries.find((e) => e.type === 'hook' && e.title === 'init');
    expect(actionEntry).toBeDefined();
    expect(actionEntry!.tags).toContain('action');
  });

  it('filter hook entries have tags including "filter"', () => {
    const ref = makeRef({
      hooks: { actions: [], filters: [makeHook('the_content', 'filter')] },
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const filterEntry = index.entries.find((e) => e.type === 'hook' && e.title === 'the_content');
    expect(filterEntry).toBeDefined();
    expect(filterEntry!.tags).toContain('filter');
  });

  it('action entries point to /hooks/actions', () => {
    const ref = makeRef({
      hooks: { actions: [makeHook('wp_init', 'action')], filters: [] },
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'hook' && e.title === 'wp_init');
    expect(entry!.href).toContain('/hooks/actions');
  });

  it('filter entries point to /hooks/filters', () => {
    const ref = makeRef({
      hooks: { actions: [], filters: [makeHook('wp_title', 'filter')] },
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'hook' && e.title === 'wp_title');
    expect(entry!.href).toContain('/hooks/filters');
  });
});

describe('buildSearchIndex — CSS token entries', () => {
  it('CSS token entries have type "css-token"', () => {
    const ref = makeRef({
      cssTokens: [makeCssToken('--color-primary'), makeCssToken('--font-size-base')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const tokenEntries = index.entries.filter((e) => e.type === 'css-token');
    expect(tokenEntries.length).toBe(2);
  });

  it('CSS token entry title matches property name', () => {
    const ref = makeRef({ cssTokens: [makeCssToken('--spacing-md')] });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const tokenEntry = index.entries.find((e) => e.type === 'css-token');
    expect(tokenEntry!.title).toBe('--spacing-md');
  });

  it('CSS token entry has href pointing to /css/tokens', () => {
    const ref = makeRef({ cssTokens: [makeCssToken('--color-bg')] });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const tokenEntry = index.entries.find((e) => e.type === 'css-token');
    expect(tokenEntry!.href).toContain('/css/tokens');
  });
});

function makeRestEndpoint(
  route: string,
  methods: string[] = ['GET'],
  description = ''
): import('../../mcp/types.js').McpRestEndpoint {
  return {
    namespace: 'my-plugin/v1',
    route,
    fullRoute: `my-plugin/v1${route}`,
    methods,
    description,
    params: [],
    file: 'rest-api.php',
    line: 1,
  };
}

describe('buildSearchIndex — REST endpoint entries', () => {
  it('REST endpoints appear in entries with type "rest-endpoint"', () => {
    const ref = makeRef({
      restEndpoints: [makeRestEndpoint('/settings', ['GET', 'POST'], 'Manage settings')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const restEntries = index.entries.filter((e) => e.type === 'rest-endpoint');
    expect(restEntries.length).toBe(1);
  });

  it('REST endpoint title includes methods and route', () => {
    const ref = makeRef({
      restEndpoints: [makeRestEndpoint('/settings', ['GET', 'POST'])],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'rest-endpoint');
    expect(entry!.title).toBe('GET/POST /settings');
  });

  it('REST endpoint entry has href pointing to /rest-api/endpoints with anchor', () => {
    const ref = makeRef({
      restEndpoints: [makeRestEndpoint('/settings', ['GET'])],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'rest-endpoint');
    expect(entry!.href).toContain('/rest-api/endpoints#');
  });

  it('REST endpoint entry has correct description when provided', () => {
    const ref = makeRef({
      restEndpoints: [makeRestEndpoint('/status', ['GET'], 'Plugin health check')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'rest-endpoint');
    expect(entry!.description).toBe('Plugin health check');
  });

  it('REST endpoint entry falls back to namespace+route description', () => {
    const ref = makeRef({
      restEndpoints: [makeRestEndpoint('/status', ['GET'], '')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'rest-endpoint');
    expect(entry!.description).toBe('my-plugin/v1/status');
  });

  it('REST endpoint entries have rest and api tags', () => {
    const ref = makeRef({
      restEndpoints: [makeRestEndpoint('/settings')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const entry = index.entries.find((e) => e.type === 'rest-endpoint');
    expect(entry!.tags).toContain('rest');
    expect(entry!.tags).toContain('api');
  });

  it('multiple REST endpoints produce correct count', () => {
    const ref = makeRef({
      restEndpoints: [
        makeRestEndpoint('/settings', ['GET', 'POST']),
        makeRestEndpoint('/status', ['GET']),
      ],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const restEntries = index.entries.filter((e) => e.type === 'rest-endpoint');
    expect(restEntries.length).toBe(2);
  });
});

describe('buildSearchIndex — class entries', () => {
  it('PHP classes appear in entries with type "class"', () => {
    const ref = makeRef({
      classes: [makeClass('WP_My_Plugin', 'Main plugin class')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);
    const classEntries = index.entries.filter((e) => e.type === 'class');
    expect(classEntries.length).toBe(1);
    expect(classEntries[0].title).toBe('WP_My_Plugin');
  });
});

describe('buildSearchIndex — mixed content', () => {
  it('all content types produce correct counts', () => {
    const ref = makeRef({
      functions: [makeFunction('fn1'), makeFunction('fn2')],
      classes: [makeClass('ClassA')],
      hooks: {
        actions: [makeHook('action1', 'action')],
        filters: [makeHook('filter1', 'filter'), makeHook('filter2', 'filter')],
      },
      cssTokens: [makeCssToken('--token1'), makeCssToken('--token2'), makeCssToken('--token3')],
      restEndpoints: [makeRestEndpoint('/settings'), makeRestEndpoint('/status')],
    });
    const nav = buildNav(ref);
    const index = buildSearchIndex(ref, nav);

    expect(index.entries.filter((e) => e.type === 'function').length).toBe(2);
    expect(index.entries.filter((e) => e.type === 'class').length).toBe(1);
    expect(index.entries.filter((e) => e.type === 'hook').length).toBe(3);
    expect(index.entries.filter((e) => e.type === 'css-token').length).toBe(3);
    expect(index.entries.filter((e) => e.type === 'rest-endpoint').length).toBe(2);
  });
});
