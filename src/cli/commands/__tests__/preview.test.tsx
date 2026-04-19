import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { PreviewCommand } from '../preview.js';
import type { CliFlags } from '../../../types/index.js';

function makeFlags(overrides: Partial<CliFlags> = {}): CliFlags {
  return { verbose: false, ...overrides };
}

describe('PreviewCommand', () => {
  describe('starting state', () => {
    it('renders the wpdocs preview heading', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="starting" />
      );
      expect(lastFrame()).toContain('wpdocs preview');
    });

    it('shows a starting message', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="starting" />
      );
      expect(lastFrame()).toContain('Starting preview server');
    });
  });

  describe('running state', () => {
    it('shows the preview URL with default port 3000', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="running" />
      );
      expect(lastFrame()).toContain('http://localhost:3000');
    });

    it('shows custom port when --port flag is set', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags({ port: 4000 })} _testStep="running" />
      );
      expect(lastFrame()).toContain('http://localhost:4000');
    });

    it('renders wpdocs preview heading in running state', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="running" />
      );
      expect(lastFrame()).toContain('wpdocs preview');
    });

    it('shows Ctrl+C hint', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="running" />
      );
      expect(lastFrame()).toContain('Ctrl+C');
    });

    it('shows verbose output dir when verbose flag is set', () => {
      const { lastFrame } = render(
        <PreviewCommand
          target="."
          flags={makeFlags({ verbose: true })}
          _testStep="running"
          _outputDir="/some/output/dir"
        />
      );
      expect(lastFrame()).toContain('/some/output/dir');
    });

    it('does not show output dir when verbose flag is not set', () => {
      const { lastFrame } = render(
        <PreviewCommand
          target="."
          flags={makeFlags({ verbose: false })}
          _testStep="running"
          _outputDir="/some/output/dir"
        />
      );
      // In non-verbose mode, the output dir should not appear on screen
      expect(lastFrame()).not.toContain('/some/output/dir');
    });
  });

  describe('no-output state', () => {
    it('shows run generate first message when output dir is missing', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="no-output" />
      );
      expect(lastFrame()).toContain('wpdocs generate');
    });

    it('shows "output not found" heading', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="no-output" />
      );
      expect(lastFrame()).toContain('output not found');
    });

    it('shows the expected output path when _outputDir is provided', () => {
      const { lastFrame } = render(
        <PreviewCommand
          target="."
          flags={makeFlags()}
          _testStep="no-output"
          _outputDir="/path/to/docs-output"
        />
      );
      expect(lastFrame()).toContain('/path/to/docs-output');
    });

    it('shows a helpful "no generated docs site found" message', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="no-output" />
      );
      expect(lastFrame()).toContain('No generated documentation site found');
    });
  });

  describe('error state', () => {
    it('renders wpdocs preview heading in error state', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="error" />
      );
      expect(lastFrame()).toContain('wpdocs preview');
    });

    it('shows "error" label in the heading', () => {
      const { lastFrame } = render(
        <PreviewCommand target="." flags={makeFlags()} _testStep="error" />
      );
      expect(lastFrame()).toContain('error');
    });
  });
});
