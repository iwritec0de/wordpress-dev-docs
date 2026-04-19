import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { McpCommand } from '../mcp.js';

const defaultFlags = {};

describe('McpCommand — heading', () => {
  it('shows "wpdocs mcp" heading', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="starting" />
    );
    expect(lastFrame()).toContain('wpdocs mcp');
  });
});

describe('McpCommand — running state', () => {
  it('shows server URL in running state', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="running" />
    );
    expect(lastFrame()).toContain('http://localhost:');
  });

  it('shows default port 3000 in running state', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="running" />
    );
    expect(lastFrame()).toContain('3000');
  });

  it('shows custom port when provided via flags', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={{ port: 4242 }} _testStep="running" />
    );
    expect(lastFrame()).toContain('4242');
  });

  it('shows available endpoints list in running state', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="running" />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('/functions');
    expect(frame).toContain('/hooks');
  });

  it('shows Ctrl+C message in running state', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="running" />
    );
    expect(lastFrame()).toContain('Ctrl+C');
  });
});

describe('McpCommand — starting state', () => {
  it('shows starting message', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="starting" />
    );
    expect(lastFrame()).toContain('Starting');
  });

  it('shows port number in starting state', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={{ port: 8080 }} _testStep="starting" />
    );
    expect(lastFrame()).toContain('8080');
  });
});

describe('McpCommand — no-reference state', () => {
  it('shows no reference message', () => {
    const { lastFrame } = render(
      <McpCommand target="./my-plugin" flags={defaultFlags} _testStep="no-reference" />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('No MCP reference');
  });

  it('shows the target in the no-reference message', () => {
    const { lastFrame } = render(
      <McpCommand target="./my-plugin" flags={defaultFlags} _testStep="no-reference" />
    );
    expect(lastFrame()).toContain('./my-plugin');
  });

  it('shows hint to run generate', () => {
    const { lastFrame } = render(
      <McpCommand target="." flags={defaultFlags} _testStep="no-reference" />
    );
    expect(lastFrame()).toContain('generate');
  });
});

describe('McpCommand — error state', () => {
  it('shows error message', () => {
    const { lastFrame } = render(<McpCommand target="." flags={defaultFlags} _testStep="error" />);
    expect(lastFrame()).toContain('Error');
  });
});

describe('McpCommand — default render (no _testStep)', () => {
  it('renders without crashing', () => {
    const { lastFrame } = render(<McpCommand target="./plugin" flags={defaultFlags} />);
    expect(lastFrame()).toContain('wpdocs mcp');
  });

  it('shows starting state', () => {
    const { lastFrame } = render(<McpCommand target="./my-plugin" flags={defaultFlags} />);
    expect(lastFrame()).toContain('Starting MCP server on port 3000');
  });
});
