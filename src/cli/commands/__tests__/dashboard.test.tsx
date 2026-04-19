import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { DashboardCommand } from '../dashboard.js';

describe('DashboardCommand', () => {
  it('renders without error', () => {
    const { lastFrame } = render(<DashboardCommand />);
    expect(lastFrame()).toBeTruthy();
  });

  it('shows the project name', () => {
    const { lastFrame } = render(<DashboardCommand />);
    expect(lastFrame()).toContain('wpdocs');
  });

  it('shows version when provided', () => {
    const { lastFrame } = render(<DashboardCommand version="0.1.0" />);
    expect(lastFrame()).toContain('v0.1.0');
  });

  it('shows available commands list', () => {
    const { lastFrame } = render(<DashboardCommand />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('generate');
    expect(frame).toContain('init');
    expect(frame).toContain('preview');
    expect(frame).toContain('validate');
    expect(frame).toContain('mcp');
  });

  it('shows the quick start section', () => {
    const { lastFrame } = render(<DashboardCommand />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Quick start');
    expect(frame).toContain('wpdocs generate');
  });

  it('shows the description', () => {
    const { lastFrame } = render(<DashboardCommand />);
    expect(lastFrame()).toContain('documentation generator');
  });
});
