import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InitCommand, buildConfig } from '../init.js';
import type { Answers } from '../init.js';
import { resolveConfig } from '../../../config/loader.js';

// ─── buildConfig — pure logic tests ──────────────────────────────────────────

describe('buildConfig', () => {
  const base: Answers = {
    name: 'My Plugin',
    type: 'plugin',
    source: './',
    output: './docs-output',
    mcp: false,
  };

  it('sets name', () => {
    expect(buildConfig(base).name).toBe('My Plugin');
  });

  it('sets type', () => {
    expect(buildConfig(base).type).toBe('plugin');
  });

  it('sets source', () => {
    expect(buildConfig(base).source).toBe('./');
  });

  it('sets output', () => {
    expect(buildConfig(base).output).toBe('./docs-output');
  });

  it('sets theme to "default"', () => {
    expect(buildConfig(base).theme).toBe('default');
  });

  it('sets mcp.enabled to false when mcp = false', () => {
    expect(buildConfig(base).mcp.enabled).toBe(false);
  });

  it('sets mcp.enabled to true when mcp = true', () => {
    expect(buildConfig({ ...base, mcp: true }).mcp.enabled).toBe(true);
  });

  it('sets mcp.output to ./mcp-reference', () => {
    expect(buildConfig(base).mcp.output).toBe('./mcp-reference');
  });

  it('derives site.title from name', () => {
    expect(buildConfig(base).site.title).toBe('My Plugin Docs');
  });

  it('derives site.description from name', () => {
    expect(buildConfig(base).site.description).toContain('My Plugin');
  });

  it('includes vendor/** in exclude', () => {
    expect(buildConfig(base).exclude).toContain('vendor/**');
  });

  it('includes node_modules/** in exclude', () => {
    expect(buildConfig(base).exclude).toContain('node_modules/**');
  });

  it('works with theme type', () => {
    const config = buildConfig({ ...base, name: 'My Theme', type: 'theme' });
    expect(config.type).toBe('theme');
    expect(config.site.title).toBe('My Theme Docs');
  });

  it('produces a config that passes loadConfig validation (round-trip)', () => {
    const built = buildConfig(base);
    // resolveConfig throws if Zod rejects the object.
    expect(() => resolveConfig(built)).not.toThrow();
  });

  it('round-trip works for theme type', () => {
    const built = buildConfig({ ...base, type: 'theme' });
    expect(() => resolveConfig(built)).not.toThrow();
  });

  it('round-trip works for collection type', () => {
    const built = buildConfig({ ...base, type: 'collection' });
    expect(() => resolveConfig(built)).not.toThrow();
  });

  it('works with collection type', () => {
    expect(buildConfig({ ...base, type: 'collection' }).type).toBe('collection');
  });

  it('uses custom source', () => {
    expect(buildConfig({ ...base, source: './src' }).source).toBe('./src');
  });

  it('uses custom output', () => {
    expect(buildConfig({ ...base, output: './dist/docs' }).output).toBe('./dist/docs');
  });

  it('produces valid JSON-serializable output', () => {
    expect(() => JSON.stringify(buildConfig(base))).not.toThrow();
  });
});

// ─── InitCommand rendering — steps that don't use useInput ───────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'wpdocs-init-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('InitCommand — exists step', () => {
  it('shows "already exists" warning when config file is present', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), '{"name":"existing"}');
    const { lastFrame } = render(<InitCommand cwd={tmpDir} />);
    expect(lastFrame()).toContain('already exists');
  });

  it('includes the file path in the warning', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), '{"name":"existing"}');
    const { lastFrame } = render(<InitCommand cwd={tmpDir} />);
    expect(lastFrame()).toContain('docs.config.json');
  });

  it('does not show the name prompt when in exists step', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), '{"name":"existing"}');
    const { lastFrame } = render(<InitCommand cwd={tmpDir} />);
    expect(lastFrame()).not.toContain('Plugin / theme name');
  });

  it('shows exists step via _testStep prop', () => {
    const { lastFrame } = render(<InitCommand cwd={tmpDir} _testStep="exists" />);
    expect(lastFrame()).toContain('already exists');
  });
});

describe('InitCommand — done step', () => {
  const doneAnswers: Answers = {
    name: 'Awesome Plugin',
    type: 'plugin',
    source: './',
    output: './docs-output',
    mcp: false,
  };

  it('shows "Created docs.config.json"', () => {
    const { lastFrame } = render(
      <InitCommand cwd={tmpDir} _testStep="done" _testAnswers={doneAnswers} />
    );
    expect(lastFrame()).toContain('Created docs.config.json');
  });

  it('shows the plugin name', () => {
    const { lastFrame } = render(
      <InitCommand cwd={tmpDir} _testStep="done" _testAnswers={doneAnswers} />
    );
    expect(lastFrame()).toContain('Awesome Plugin');
  });

  it('shows wpdocs generate hint', () => {
    const { lastFrame } = render(
      <InitCommand cwd={tmpDir} _testStep="done" _testAnswers={doneAnswers} />
    );
    expect(lastFrame()).toContain('wpdocs generate');
  });

  it('shows type in summary', () => {
    const { lastFrame } = render(
      <InitCommand cwd={tmpDir} _testStep="done" _testAnswers={doneAnswers} />
    );
    expect(lastFrame()).toContain('plugin');
  });

  it('shows MCP status in summary', () => {
    const { lastFrame } = render(
      <InitCommand cwd={tmpDir} _testStep="done" _testAnswers={{ ...doneAnswers, mcp: true }} />
    );
    expect(lastFrame()).toContain('enabled');
  });
});

describe('InitCommand — error step', () => {
  it('shows error heading when in error step', () => {
    const { lastFrame } = render(<InitCommand cwd={tmpDir} _testStep="error" />);
    expect(lastFrame()).toContain('Failed to write');
  });
});
