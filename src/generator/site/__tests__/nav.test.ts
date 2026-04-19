import { describe, it, expect } from 'vitest';
import { buildNav } from '../nav.js';
import type { McpReference } from '../../mcp/types.js';
import type { GuideSection } from '../../../parser/guides/types.js';

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

function makeHook(name: string, type: 'action' | 'filter'): import('../../mcp/types.js').McpHook {
  return {
    name,
    type,
    description: '',
    since: null,
    dispatchArgCount: null,
    params: [],
    file: 'plugin.php',
    line: 1,
  };
}

function makeFunction(name: string): import('../../mcp/types.js').McpFunction {
  return {
    name,
    description: '',
    params: [],
    returns: null,
    since: null,
    deprecated: null,
    file: 'plugin.php',
    line: 1,
  };
}

function makeClass(name: string): import('../../mcp/types.js').McpClass {
  return {
    name,
    description: '',
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

function makeCssToken(name: string): import('../../mcp/types.js').McpCssToken {
  return {
    name,
    value: '#fff',
    description: null,
    scope: ':root',
    file: 'style.css',
    line: 1,
  };
}

function makeJsFunction(name: string): import('../../mcp/types.js').McpJsFunction {
  return {
    name,
    description: '',
    params: [],
    returns: null,
    since: null,
    deprecated: null,
    file: 'index.js',
    line: 1,
  };
}

describe('buildNav — Overview section', () => {
  it('Overview section is always present', () => {
    const nav = buildNav(makeRef());
    const overview = nav.find((s) => s.slug === 'overview');
    expect(overview).toBeDefined();
  });

  it('Overview section contains an Overview item linking to /', () => {
    const nav = buildNav(makeRef());
    const overview = nav.find((s) => s.slug === 'overview')!;
    expect(overview.items.some((i) => i.href === '/')).toBe(true);
  });
});

describe('buildNav — PHP Reference section', () => {
  it('PHP Reference section does not appear when no functions or classes', () => {
    const nav = buildNav(makeRef());
    const php = nav.find((s) => s.slug === 'php');
    expect(php).toBeUndefined();
  });

  it('PHP Reference section appears when functions exist', () => {
    const nav = buildNav(makeRef({ functions: [makeFunction('my_func')] }));
    const php = nav.find((s) => s.slug === 'php');
    expect(php).toBeDefined();
  });

  it('PHP Reference Functions item has badge equal to function count', () => {
    const nav = buildNav(
      makeRef({ functions: [makeFunction('fn1'), makeFunction('fn2'), makeFunction('fn3')] })
    );
    const php = nav.find((s) => s.slug === 'php')!;
    const fnItem = php.items.find((i) => i.href === '/php/functions');
    expect(fnItem).toBeDefined();
    expect(fnItem!.badge).toBe('3');
  });

  it('PHP Reference Classes item appears when classes exist', () => {
    const nav = buildNav(
      makeRef({ functions: [makeFunction('fn1')], classes: [makeClass('MyClass')] })
    );
    const php = nav.find((s) => s.slug === 'php')!;
    const classItem = php.items.find((i) => i.href === '/php/classes');
    expect(classItem).toBeDefined();
  });

  it('PHP Reference Classes item has badge equal to class count', () => {
    const nav = buildNav(makeRef({ classes: [makeClass('A'), makeClass('B')] }));
    const php = nav.find((s) => s.slug === 'php')!;
    const classItem = php.items.find((i) => i.href === '/php/classes')!;
    expect(classItem.badge).toBe('2');
  });
});

describe('buildNav — Hooks section', () => {
  it('Hooks section does not appear when no actions or filters', () => {
    const nav = buildNav(makeRef());
    expect(nav.find((s) => s.slug === 'hooks')).toBeUndefined();
  });

  it('Hooks section appears when actions exist', () => {
    const nav = buildNav(
      makeRef({ hooks: { actions: [makeHook('init', 'action')], filters: [] } })
    );
    expect(nav.find((s) => s.slug === 'hooks')).toBeDefined();
  });

  it('Actions item has badge with action count', () => {
    const nav = buildNav(
      makeRef({
        hooks: {
          actions: [makeHook('init', 'action'), makeHook('wp_loaded', 'action')],
          filters: [],
        },
      })
    );
    const hooks = nav.find((s) => s.slug === 'hooks')!;
    const actionsItem = hooks.items.find((i) => i.href === '/hooks/actions');
    expect(actionsItem).toBeDefined();
    expect(actionsItem!.badge).toBe('2');
  });

  it('Filters item has badge with filter count', () => {
    const nav = buildNav(
      makeRef({
        hooks: {
          actions: [],
          filters: [makeHook('the_content', 'filter'), makeHook('the_title', 'filter')],
        },
      })
    );
    const hooks = nav.find((s) => s.slug === 'hooks')!;
    const filtersItem = hooks.items.find((i) => i.href === '/hooks/filters');
    expect(filtersItem).toBeDefined();
    expect(filtersItem!.badge).toBe('2');
  });
});

describe('buildNav — JavaScript section', () => {
  it('JS section does not appear when no JS functions', () => {
    const nav = buildNav(makeRef());
    expect(nav.find((s) => s.slug === 'js')).toBeUndefined();
  });

  it('JS section appears when JS functions exist', () => {
    const nav = buildNav(makeRef({ js: { functions: [makeJsFunction('myFunc')] } }));
    expect(nav.find((s) => s.slug === 'js')).toBeDefined();
  });

  it('JS section Functions item has badge with JS function count', () => {
    const nav = buildNav(
      makeRef({ js: { functions: [makeJsFunction('a'), makeJsFunction('b')] } })
    );
    const js = nav.find((s) => s.slug === 'js')!;
    const fnItem = js.items.find((i) => i.href === '/js/functions');
    expect(fnItem).toBeDefined();
    expect(fnItem!.badge).toBe('2');
  });
});

describe('buildNav — Changelog section', () => {
  it('Changelog section is always present', () => {
    const nav = buildNav(makeRef());
    expect(nav.find((s) => s.slug === 'changelog')).toBeDefined();
  });

  it('Changelog section is present even with rich data', () => {
    const nav = buildNav(
      makeRef({
        functions: [makeFunction('fn1')],
        hooks: { actions: [makeHook('init', 'action')], filters: [] },
        cssTokens: [makeCssToken('--color-primary')],
      })
    );
    expect(nav.find((s) => s.slug === 'changelog')).toBeDefined();
  });
});

function makeRestEndpoint(
  route: string,
  methods: string[] = ['GET']
): import('../../mcp/types.js').McpRestEndpoint {
  return {
    namespace: 'my-plugin/v1',
    route,
    fullRoute: `my-plugin/v1${route}`,
    methods,
    description: `Endpoint for ${route}`,
    params: [],
    file: 'rest-api.php',
    line: 1,
  };
}

describe('buildNav — REST API section', () => {
  it('REST API section does not appear when no endpoints', () => {
    const nav = buildNav(makeRef());
    expect(nav.find((s) => s.slug === 'rest-api')).toBeUndefined();
  });

  it('REST API section appears when endpoints exist', () => {
    const nav = buildNav(makeRef({ restEndpoints: [makeRestEndpoint('/settings')] }));
    expect(nav.find((s) => s.slug === 'rest-api')).toBeDefined();
  });

  it('REST API Endpoints item has badge with endpoint count', () => {
    const nav = buildNav(
      makeRef({
        restEndpoints: [makeRestEndpoint('/settings'), makeRestEndpoint('/status')],
      })
    );
    const restSection = nav.find((s) => s.slug === 'rest-api')!;
    const endpointsItem = restSection.items.find((i) => i.href === '/rest-api/endpoints');
    expect(endpointsItem).toBeDefined();
    expect(endpointsItem!.badge).toBe('2');
  });

  it('REST API section appears between JS and CSS sections', () => {
    const nav = buildNav(
      makeRef({
        js: { functions: [makeJsFunction('a')] },
        restEndpoints: [makeRestEndpoint('/settings')],
        cssTokens: [makeCssToken('--a')],
      })
    );
    const slugs = nav.map((s) => s.slug);
    const jsIdx = slugs.indexOf('js');
    const restIdx = slugs.indexOf('rest-api');
    const cssIdx = slugs.indexOf('css');
    expect(restIdx).toBeGreaterThan(jsIdx);
    expect(restIdx).toBeLessThan(cssIdx);
  });
});

describe('buildNav — CSS Tokens section', () => {
  it('CSS section does not appear when no tokens', () => {
    const nav = buildNav(makeRef());
    expect(nav.find((s) => s.slug === 'css')).toBeUndefined();
  });

  it('CSS section appears when tokens exist', () => {
    const nav = buildNav(makeRef({ cssTokens: [makeCssToken('--color-primary')] }));
    expect(nav.find((s) => s.slug === 'css')).toBeDefined();
  });

  it('CSS token item has badge with token count', () => {
    const nav = buildNav(
      makeRef({ cssTokens: [makeCssToken('--a'), makeCssToken('--b'), makeCssToken('--c')] })
    );
    const css = nav.find((s) => s.slug === 'css')!;
    const tokenItem = css.items.find((i) => i.href === '/css/tokens');
    expect(tokenItem).toBeDefined();
    expect(tokenItem!.badge).toBe('3');
  });
});

describe('buildNav — Guide sections (F2 mdx-guides)', () => {
  const guides: GuideSection[] = [
    {
      title: 'Getting Started',
      slug: 'guides/intro',
      items: [
        { title: 'Welcome', slug: 'guides/intro/welcome' },
        { title: 'Install', slug: 'guides/intro/install' },
      ],
    },
    {
      title: 'Advanced',
      slug: 'guides/advanced',
      items: [{ title: 'Hooks', slug: 'guides/advanced/hooks' }],
      subsections: [
        {
          title: 'Patterns',
          slug: 'guides/advanced/patterns',
          items: [{ title: 'Singleton', slug: 'guides/advanced/patterns/singleton' }],
        },
      ],
    },
  ];

  it('omits guide sections when guideSections arg is not provided', () => {
    const nav = buildNav(makeRef());
    expect(nav.find((s) => s.slug.startsWith('guides/'))).toBeUndefined();
  });

  it('omits guide sections when an empty array is passed', () => {
    const nav = buildNav(makeRef(), []);
    expect(nav.find((s) => s.slug.startsWith('guides/'))).toBeUndefined();
  });

  it('inserts guide sections immediately after Overview', () => {
    const nav = buildNav(makeRef({ functions: [makeFunction('fn1')] }), guides);
    expect(nav[0].slug).toBe('overview');
    expect(nav[1].slug).toBe('guides/intro');
    expect(nav[2].slug).toBe('guides/advanced');
  });

  it('inserts guide sections before PHP Reference', () => {
    const nav = buildNav(makeRef({ functions: [makeFunction('fn1')] }), guides);
    const guideIdx = nav.findIndex((s) => s.slug === 'guides/intro');
    const phpIdx = nav.findIndex((s) => s.slug === 'php');
    expect(guideIdx).toBeGreaterThanOrEqual(0);
    expect(phpIdx).toBeGreaterThan(guideIdx);
  });

  it('maps guide items to NavItems with /-prefixed hrefs', () => {
    const nav = buildNav(makeRef(), guides);
    const intro = nav.find((s) => s.slug === 'guides/intro')!;
    expect(intro.title).toBe('Getting Started');
    expect(intro.items.map((i) => i.href)).toEqual([
      '/guides/intro/welcome',
      '/guides/intro/install',
    ]);
  });

  it('flattens subsection items with a "Subsection / Item" title prefix', () => {
    const nav = buildNav(makeRef(), guides);
    const advanced = nav.find((s) => s.slug === 'guides/advanced')!;
    expect(advanced.items.map((i) => i.title)).toEqual(['Hooks', 'Patterns / Singleton']);
    expect(advanced.items.map((i) => i.href)).toEqual([
      '/guides/advanced/hooks',
      '/guides/advanced/patterns/singleton',
    ]);
  });

  it('skips guide sections with no items after flattening', () => {
    const empty: GuideSection[] = [{ title: 'Empty', slug: 'guides/empty', items: [] }];
    const nav = buildNav(makeRef(), empty);
    expect(nav.find((s) => s.slug === 'guides/empty')).toBeUndefined();
  });

  it('preserves existing reference section order after Overview + guides', () => {
    const nav = buildNav(
      makeRef({
        functions: [makeFunction('fn1')],
        hooks: { actions: [makeHook('init', 'action')], filters: [] },
        js: { functions: [makeJsFunction('a')] },
        restEndpoints: [makeRestEndpoint('/settings')],
        cssTokens: [makeCssToken('--a')],
      }),
      guides
    );
    expect(nav.map((s) => s.slug)).toEqual([
      'overview',
      'guides/intro',
      'guides/advanced',
      'php',
      'hooks',
      'js',
      'rest-api',
      'css',
      'changelog',
    ]);
  });
});
