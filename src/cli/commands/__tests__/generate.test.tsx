import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { StageRow, ResultSummary, STAGE_LABELS, STAGE_ORDER } from '../generate.js';
import type { GeneratePipelineResult } from '../../../generator/index.js';

// ─── StageRow ─────────────────────────────────────────────────────────────────

describe('StageRow', () => {
  it('renders a pending stage as dim text', () => {
    const { lastFrame } = render(<StageRow label="Parse source" status="pending" />);
    expect(lastFrame()).toContain('Parse source');
  });

  it('renders a running stage with a bullet and message', () => {
    const { lastFrame } = render(
      <StageRow label="Parse source" status="running" message="scanning PHP files" />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Parse source');
    expect(frame).toContain('scanning PHP files');
  });

  it('renders a done stage with a check', () => {
    const { lastFrame } = render(<StageRow label="Parse source" status="done" />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('✓');
    expect(frame).toContain('Parse source');
  });
});

// ─── Stage label + order constants ────────────────────────────────────────────

describe('stage metadata', () => {
  it('labels every stage', () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_LABELS[stage]).toBeTruthy();
    }
  });

  it('orders stages config → parse → mcp → scaffold → done', () => {
    expect(STAGE_ORDER).toEqual(['config', 'parse', 'mcp', 'scaffold', 'done']);
  });
});

// ─── ResultSummary ────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<GeneratePipelineResult> = {}): GeneratePipelineResult {
  return {
    parseResult: {
      sourceRoot: '/tmp/plugin',
      php: [{ functions: [{ name: 'foo' }, { name: 'bar' }], classes: [{ name: 'Baz' }] }],
      hooks: [{ hooks: [{ name: 'init' }] }],
      js: [{ functions: [{ name: 'jsFn' }], classes: [] }],
      css: [{ customProperties: [{ name: '--color' }] }],
    } as unknown as GeneratePipelineResult['parseResult'],
    reference: {
      functions: [{ name: 'foo' }, { name: 'bar' }],
      classes: [{ name: 'Baz' }],
      constants: [{ name: 'VER' }],
    } as unknown as GeneratePipelineResult['reference'],
    scaffoldResult: {
      outputDir: '/tmp/plugin-docs',
      filesWritten: ['a', 'b', 'c'],
      dataFile: '/tmp/plugin-docs/public/data/site-data.json',
      warnings: [],
    },
    mcpOutputPath: '/tmp/plugin-docs/mcp.json',
    dryRun: false,
    warnings: [],
    ...overrides,
  };
}

describe('ResultSummary', () => {
  it('shows success heading when not a dry run', () => {
    const { lastFrame } = render(<ResultSummary result={makeResult()} />);
    expect(lastFrame()).toContain('Documentation generated');
  });

  it('shows dry-run heading when dryRun is true', () => {
    const { lastFrame } = render(
      <ResultSummary result={makeResult({ dryRun: true, scaffoldResult: undefined })} />
    );
    expect(lastFrame()).toContain('Dry run complete');
  });

  it('shows source path', () => {
    const { lastFrame } = render(<ResultSummary result={makeResult()} />);
    expect(lastFrame()).toContain('/tmp/plugin');
  });

  it('shows output path when scaffold succeeded', () => {
    const { lastFrame } = render(<ResultSummary result={makeResult()} />);
    expect(lastFrame()).toContain('/tmp/plugin-docs');
  });

  it('shows MCP reference path when present', () => {
    const { lastFrame } = render(<ResultSummary result={makeResult()} />);
    expect(lastFrame()).toContain('/tmp/plugin-docs/mcp.json');
  });

  it('shows counts of functions, classes, constants', () => {
    const { lastFrame } = render(<ResultSummary result={makeResult()} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Functions: 2');
    expect(frame).toContain('Classes: 1');
    expect(frame).toContain('Constants: 1');
  });

  it('lists warnings when present', () => {
    const { lastFrame } = render(
      <ResultSummary
        result={makeResult({ warnings: ['override missed: foo', 'override missed: bar'] })}
      />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Warnings (2)');
    expect(frame).toContain('override missed: foo');
  });

  it('truncates warnings past 5', () => {
    const warnings = Array.from({ length: 8 }, (_, i) => `warn-${i}`);
    const { lastFrame } = render(<ResultSummary result={makeResult({ warnings })} />);
    expect(lastFrame()).toContain('and 3 more');
  });

  it('shows preview command when scaffold exists', () => {
    const { lastFrame } = render(<ResultSummary result={makeResult()} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('npm install');
    expect(frame).toContain('npm run dev');
  });
});
