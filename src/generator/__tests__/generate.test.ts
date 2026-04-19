import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runGenerate } from '../index.js';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../parser/index.js', () => ({
  parseTarget: vi.fn().mockResolvedValue({
    sourceRoot: '/fake/plugin',
    config: {},
    php: [
      {
        functions: [
          { name: 'my_func', doc: null, params: [], returnType: null, file: 'f.php', line: 1 },
        ],
        classes: [],
        constants: [],
      },
    ],
    js: [],
    css: [],
    hooks: [
      [{ name: 'my_action', type: 'action', file: 'f.php', line: 10, doc: null, params: [] }],
    ],
    pluginHeader: {
      name: 'Test Plugin',
      version: '1.0.0',
      description: '',
      author: '',
      authorUri: '',
      pluginUri: '',
      textDomain: '',
      domainPath: '',
      network: false,
      requiresWP: '',
      requiresPHP: '',
    },
    themeHeader: null,
    readme: null,
    skippedFiles: [],
    errors: [],
  }),
}));

vi.mock('../mcp/index.js', () => ({
  buildMcpReference: vi.fn().mockReturnValue({
    name: 'test-plugin',
    version: '1.0.0',
    functions: [
      {
        name: 'my_func',
        description: '',
        parameters: [],
        returns: null,
        since: null,
        file: 'f.php',
        line: 1,
      },
    ],
    hooks: {
      actions: [
        {
          name: 'my_action',
          description: '',
          parameters: [],
          since: null,
          file: 'f.php',
          line: 10,
        },
      ],
      filters: [],
    },
    classes: [],
    rest_endpoints: [],
    js_api: [],
    constants: [],
    css_tokens: [],
  }),
  writeMcpReference: vi.fn().mockReturnValue('/fake/plugin/mcp-reference/reference.json'),
}));

vi.mock('../site/index.js', () => ({
  scaffoldSite: vi.fn().mockReturnValue({
    outputDir: '/fake/plugin/docs-output',
    filesWritten: ['package.json', 'next.config.js'],
    dataFile: 'public/data/reference.json',
  }),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
  };
});

vi.mock('../../config/loader.js', () => ({
  loadConfig: vi.fn().mockReturnValue({
    name: 'Test Plugin',
    version: '1.0.0',
    type: 'plugin',
    source: '/fake/plugin',
    exclude: ['vendor/**', 'node_modules/**'],
    output: '/fake/plugin/docs-output',
    theme: 'default',
    site: { baseUrl: '/' },
    mcp: { enabled: false, output: '/fake/plugin/mcp-reference' },
    groups: [],
  }),
  findConfig: vi.fn().mockReturnValue('/fake/plugin/docs.config.json'),
  resolveConfig: vi.fn().mockImplementation((raw) => ({
    name: raw.name ?? 'test',
    version: raw.version ?? null,
    type: raw.type ?? 'plugin',
    source: raw.source ?? '/fake/plugin',
    exclude: raw.exclude ?? ['vendor/**', 'node_modules/**'],
    output: raw.output ?? '/fake/plugin/docs-output',
    theme: raw.theme ?? 'default',
    site: raw.site ?? { baseUrl: '/' },
    mcp: raw.mcp ?? { enabled: false, output: '/fake/plugin/mcp-reference' },
    groups: raw.groups ?? [],
  })),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the full pipeline and returns a result', async () => {
    const result = await runGenerate({ targetDir: '/fake/plugin', flags: {} });

    expect(result.config).toBeDefined();
    expect(result.parseResult).toBeDefined();
    expect(result.reference).toBeDefined();
    expect(result.scaffoldResult).not.toBeNull();
    expect(result.dryRun).toBe(false);
  });

  it('calls onProgress for each stage', async () => {
    const stages: string[] = [];

    await runGenerate({ targetDir: '/fake/plugin', flags: {} }, (p) => {
      stages.push(p.stage);
    });

    expect(stages).toContain('config');
    expect(stages).toContain('parse');
    expect(stages).toContain('mcp');
    expect(stages).toContain('scaffold');
    expect(stages).toContain('done');
  });

  it('skips scaffoldSite on dry-run', async () => {
    const { scaffoldSite } = await import('../site/index.js');

    const result = await runGenerate({ targetDir: '/fake/plugin', flags: { dryRun: true } });

    expect(result.dryRun).toBe(true);
    expect(result.scaffoldResult).toBeNull();
    expect(scaffoldSite).not.toHaveBeenCalled();
  });

  it('does not write MCP reference when mcp.enabled is false', async () => {
    const { writeMcpReference } = await import('../mcp/index.js');

    const result = await runGenerate({ targetDir: '/fake/plugin', flags: {} });

    expect(result.mcpOutputPath).toBeNull();
    expect(writeMcpReference).not.toHaveBeenCalled();
  });

  it('collects parse warnings from errors array', async () => {
    const { parseTarget } = await import('../../parser/index.js');
    vi.mocked(parseTarget).mockResolvedValueOnce({
      sourceRoot: '/fake/plugin',
      config: {} as never,
      php: [],
      js: [],
      css: [],
      hooks: [],
      pluginHeader: null,
      themeHeader: null,
      readme: null,
      skippedFiles: [],
      errors: [{ file: 'bad.php', message: 'PHP parse failed: syntax error', error: new Error() }],
    });

    const result = await runGenerate({ targetDir: '/fake/plugin', flags: {} });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('bad.php');
  });

  it('throws when source directory does not exist', async () => {
    const { existsSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValueOnce(false);

    await expect(runGenerate({ targetDir: '/nonexistent', flags: {} })).rejects.toThrow(
      'Source directory not found'
    );
  });
});
