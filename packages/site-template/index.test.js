import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { TEMPLATE_DIR } from './index.js';

describe('@iwritec0de/wpdocs-site-template', () => {
  it('TEMPLATE_DIR is a non-empty string', () => {
    expect(typeof TEMPLATE_DIR).toBe('string');
    expect(TEMPLATE_DIR.length).toBeGreaterThan(0);
  });

  it('TEMPLATE_DIR points to an existing directory', () => {
    expect(existsSync(TEMPLATE_DIR)).toBe(true);
    expect(statSync(TEMPLATE_DIR).isDirectory()).toBe(true);
  });

  it('template/package.json exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'package.json'))).toBe(true);
  });

  it('template/next.config.mjs exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'next.config.mjs'))).toBe(true);
  });

  it('template/tsconfig.json exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'tsconfig.json'))).toBe(true);
  });

  it('template/postcss.config.mjs exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'postcss.config.mjs'))).toBe(true);
  });

  it('template/mdx-components.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'mdx-components.tsx'))).toBe(true);
  });

  it('template/app directory exists', () => {
    const appDir = join(TEMPLATE_DIR, 'app');
    expect(existsSync(appDir)).toBe(true);
    expect(statSync(appDir).isDirectory()).toBe(true);
  });

  it('template/app/layout.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'layout.tsx'))).toBe(true);
  });

  it('template/app/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'page.tsx'))).toBe(true);
  });

  it('template/app/globals.css exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'globals.css'))).toBe(true);
  });

  it('template/app/tokens.css exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'tokens.css'))).toBe(true);
  });

  it('template/components/Sidebar.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'Sidebar.tsx'))).toBe(true);
  });

  it('template/components/TopNav.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'TopNav.tsx'))).toBe(true);
  });

  it('template/components/AppShell.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'AppShell.tsx'))).toBe(true);
  });

  it('template/components/SearchModal.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'SearchModal.tsx'))).toBe(true);
  });

  it('template/components/ReferenceCard.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'ReferenceCard.tsx'))).toBe(true);
  });

  it('template/components/TocRight.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'TocRight.tsx'))).toBe(true);
  });

  it('template/components/ThemeProvider.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'components', 'ThemeProvider.tsx'))).toBe(true);
  });

  it('template/lib/data.ts exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'lib', 'data.ts'))).toBe(true);
  });

  it('template/public/data/site-data.json exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'public', 'data', 'site-data.json'))).toBe(true);
  });

  it('template/app/php/functions/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'php', 'functions', 'page.tsx'))).toBe(true);
  });

  it('template/app/php/classes/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'php', 'classes', 'page.tsx'))).toBe(true);
  });

  it('template/app/hooks/actions/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'hooks', 'actions', 'page.tsx'))).toBe(true);
  });

  it('template/app/hooks/filters/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'hooks', 'filters', 'page.tsx'))).toBe(true);
  });

  it('template/app/css/tokens/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'css', 'tokens', 'page.tsx'))).toBe(true);
  });

  it('template/app/changelog/page.tsx exists', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'app', 'changelog', 'page.tsx'))).toBe(true);
  });

  it('template/next.config.mjs sets output to export', () => {
    const content = require('fs').readFileSync(join(TEMPLATE_DIR, 'next.config.mjs'), 'utf8');
    expect(content).toContain("output: 'export'");
  });

  it('template/next.config.mjs enables MDX page extensions', () => {
    const content = require('fs').readFileSync(join(TEMPLATE_DIR, 'next.config.mjs'), 'utf8');
    expect(content).toContain('mdx');
    expect(content).toContain('pageExtensions');
  });

  it('template/app/globals.css imports tailwindcss', () => {
    const content = require('fs').readFileSync(join(TEMPLATE_DIR, 'app', 'globals.css'), 'utf8');
    expect(content).toContain('tailwindcss');
  });

  it('TEMPLATE_DIR path ends with /template', () => {
    expect(TEMPLATE_DIR.endsWith('/template') || TEMPLATE_DIR.endsWith('\\template')).toBe(true);
  });
});
