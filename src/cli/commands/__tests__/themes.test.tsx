import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { ThemesCommand, loadSkinSummaries } from '../themes.js';
import { BUILT_IN_SKINS } from '../../../generator/site/tokens.js';

describe('loadSkinSummaries', () => {
  it('returns one entry per built-in skin', () => {
    const skins = loadSkinSummaries();
    expect(skins).toHaveLength(BUILT_IN_SKINS.length);
  });

  it('includes id and human-readable name for every skin', () => {
    const skins = loadSkinSummaries();
    for (const skin of skins) {
      expect(skin.id).toBeTruthy();
      expect(skin.name).toBeTruthy();
      expect(typeof skin.hasDark).toBe('boolean');
      expect(typeof skin.accentColor).toBe('string');
    }
  });

  it('matches the BUILT_IN_SKINS allowlist exactly (order-independent)', () => {
    const ids = loadSkinSummaries()
      .map((s) => s.id)
      .sort();
    const expected = [...BUILT_IN_SKINS].sort();
    expect(ids).toEqual(expected);
  });
});

describe('ThemesCommand', () => {
  it('renders without error', () => {
    const { lastFrame } = render(<ThemesCommand />);
    expect(lastFrame()).toBeTruthy();
  });

  it('lists every built-in skin id', () => {
    const { lastFrame } = render(<ThemesCommand />);
    const frame = lastFrame() ?? '';
    for (const id of BUILT_IN_SKINS) {
      expect(frame).toContain(id);
    }
  });

  it('shows the usage hint', () => {
    const { lastFrame } = render(<ThemesCommand />);
    expect(lastFrame()).toContain('--skin');
  });
});
