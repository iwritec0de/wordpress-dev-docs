import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { App } from '../App.js';
import type { CliInput } from '../../types/index.js';

function makeInput(overrides: Partial<CliInput> = {}): CliInput {
  return {
    command: 'generate',
    target: '.',
    flags: {},
    ...overrides,
  };
}

describe('App', () => {
  it('renders generate command output', () => {
    const { lastFrame } = render(<App input={makeInput()} />);
    expect(lastFrame()).toContain('wpdocs generate');
  });

  it('renders init command output', () => {
    const { lastFrame } = render(<App input={makeInput({ command: 'init' })} />);
    expect(lastFrame()).toContain('wpdocs init');
  });

  it('renders preview command output', () => {
    const { lastFrame } = render(<App input={makeInput({ command: 'preview' })} />);
    expect(lastFrame()).toContain('wpdocs preview');
  });

  it('renders themes command listing built-in skins', () => {
    const { lastFrame } = render(<App input={makeInput({ command: 'themes' })} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('built-in skins');
    expect(frame).toContain('default');
  });

  it('renders dashboard when command is dashboard', () => {
    const { lastFrame } = render(<App input={makeInput({ command: 'dashboard' })} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('wpdocs');
    expect(frame).toContain('generate');
    expect(frame).toContain('validate');
  });

  it('shows verbose flag does not error in generate output', () => {
    const { lastFrame } = render(<App input={makeInput({ flags: { verbose: true } })} />);
    expect(lastFrame()).toContain('wpdocs generate');
  });

  it('shows dry-run flag in generate output header', () => {
    const { lastFrame } = render(<App input={makeInput({ flags: { dryRun: true } })} />);
    expect(lastFrame()).toContain('--dry-run');
  });
});
