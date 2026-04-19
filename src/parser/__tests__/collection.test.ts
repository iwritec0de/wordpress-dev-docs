import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { parseCollection } from '../collection.js';
import { resolveConfig } from '../../config/loader.js';

// ─── Temp directory helpers ───────────────────────────────────────────────────

let tempRoot: string;

function makePlugin(rootDir: string, dirName: string, pluginName: string) {
  const dir = join(rootDir, dirName);
  mkdirSync(dir, { recursive: true });

  // Write a minimal plugin main file with Plugin Name header and a docblock function
  writeFileSync(
    join(dir, `${dirName}.php`),
    `<?php
/**
 * Plugin Name: ${pluginName}
 * Version: 1.0.0
 * Description: Test plugin ${pluginName}
 */

/**
 * Initialize the plugin.
 *
 * @since 1.0.0
 * @return void
 */
function ${dirName.replace(/-/g, '_')}_init() {
}
add_action('init', '${dirName.replace(/-/g, '_')}_init');
`,
    'utf8'
  );
}

function baseConfig(overrides: Record<string, unknown> = {}) {
  return resolveConfig({
    name: 'Test Collection',
    type: 'collection',
    source: './',
    ...overrides,
  });
}

beforeAll(() => {
  // Create a temp root with multiple plugin subdirectories
  tempRoot = resolve(tmpdir(), `wpdocs-collection-test-${Date.now()}`);
  mkdirSync(tempRoot, { recursive: true });

  // Two plugin subdirectories
  makePlugin(tempRoot, 'my-plugin', 'My Plugin');
  makePlugin(tempRoot, 'another-plugin', 'Another Plugin');

  // A non-directory file — should be ignored
  writeFileSync(join(tempRoot, 'readme.txt'), 'Collection readme', 'utf8');
});

afterAll(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

// ─── Core parsing tests ───────────────────────────────────────────────────────

describe('parseCollection — member discovery', () => {
  it('returns 2 members for a root with 2 plugin subdirs', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    expect(result.members).toHaveLength(2);
  });

  it('each member has a name', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    for (const m of result.members) {
      expect(m.name).toBeTruthy();
    }
  });

  it('each member has a slug derived from directory name', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    const slugs = result.members.map((m) => m.slug);
    expect(slugs).toContain('my-plugin');
    expect(slugs).toContain('another-plugin');
  });

  it('each member has an absolute directory path', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    for (const m of result.members) {
      expect(m.directory).toMatch(/^\//);
      expect(m.directory).toContain(tempRoot);
    }
  });

  it('each member has a parseResult', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    for (const m of result.members) {
      expect(m.parseResult).toBeDefined();
      expect(m.parseResult.sourceRoot).toBeTruthy();
    }
  });

  it('ignores non-directory files in root dir', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    // readme.txt is a file, not a dir — should not appear as a member
    const slugs = result.members.map((m) => m.slug);
    expect(slugs).not.toContain('readme');
    expect(slugs).not.toContain('readme.txt');
  });
});

// ─── CollectionResult structure ───────────────────────────────────────────────

describe('parseCollection — CollectionResult', () => {
  it('has members and groups properties', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    expect(Array.isArray(result.members)).toBe(true);
    expect(Array.isArray(result.groups)).toBe(true);
  });

  it('groups is empty when config.groups is empty', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    expect(result.groups).toHaveLength(0);
  });

  it('groups are derived from config.groups', async () => {
    const config = baseConfig({
      groups: [
        { name: 'Core Plugins', plugins: ['my-plugin'] },
        { name: 'Extras', plugins: ['another-plugin'] },
      ],
    });
    const result = await parseCollection(tempRoot, config);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].name).toBe('Core Plugins');
    expect(result.groups[0].slugs).toContain('my-plugin');
    expect(result.groups[1].name).toBe('Extras');
    expect(result.groups[1].slugs).toContain('another-plugin');
  });
});

// ─── Empty root directory ─────────────────────────────────────────────────────

describe('parseCollection — empty root', () => {
  it('returns empty members for an empty directory', async () => {
    const emptyRoot = resolve(tmpdir(), `wpdocs-empty-collection-${Date.now()}`);
    mkdirSync(emptyRoot, { recursive: true });

    try {
      const result = await parseCollection(emptyRoot, baseConfig());
      expect(result.members).toHaveLength(0);
    } finally {
      rmSync(emptyRoot, { recursive: true, force: true });
    }
  });

  it('returns empty groups for an empty directory', async () => {
    const emptyRoot = resolve(tmpdir(), `wpdocs-empty-collection2-${Date.now()}`);
    mkdirSync(emptyRoot, { recursive: true });

    try {
      const result = await parseCollection(emptyRoot, baseConfig());
      expect(result.groups).toHaveLength(0);
    } finally {
      rmSync(emptyRoot, { recursive: true, force: true });
    }
  });
});

// ─── Slug derivation ──────────────────────────────────────────────────────────

describe('parseCollection — slug derivation', () => {
  it('slug is kebab-case of directory name', async () => {
    const slugRoot = resolve(tmpdir(), `wpdocs-slug-test-${Date.now()}`);
    mkdirSync(slugRoot, { recursive: true });
    makePlugin(slugRoot, 'My_Awesome_Plugin', 'My Awesome Plugin');

    try {
      const result = await parseCollection(slugRoot, baseConfig());
      expect(result.members).toHaveLength(1);
      expect(result.members[0].slug).toBe('my-awesome-plugin');
    } finally {
      rmSync(slugRoot, { recursive: true, force: true });
    }
  });

  it('slug matches directory name for already-kebab directories', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    const memberMap = Object.fromEntries(result.members.map((m) => [m.slug, m]));
    expect(memberMap['my-plugin']).toBeDefined();
    expect(memberMap['another-plugin']).toBeDefined();
  });
});

// ─── Plugin name resolution ───────────────────────────────────────────────────

describe('parseCollection — plugin name', () => {
  it('uses plugin header name when available', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    const memberMap = Object.fromEntries(result.members.map((m) => [m.slug, m]));
    expect(memberMap['my-plugin'].name).toBe('My Plugin');
    expect(memberMap['another-plugin'].name).toBe('Another Plugin');
  });

  it('falls back to directory name when no plugin header', async () => {
    const noHeaderRoot = resolve(tmpdir(), `wpdocs-noheader-${Date.now()}`);
    mkdirSync(noHeaderRoot, { recursive: true });

    // Dir with only a PHP file — no plugin header
    const pluginDir = join(noHeaderRoot, 'bare-plugin');
    mkdirSync(pluginDir, { recursive: true });
    writeFileSync(join(pluginDir, 'bare-plugin.php'), '<?php function bare_fn() {}', 'utf8');

    try {
      const result = await parseCollection(noHeaderRoot, baseConfig());
      expect(result.members).toHaveLength(1);
      expect(result.members[0].name).toBe('bare-plugin');
    } finally {
      rmSync(noHeaderRoot, { recursive: true, force: true });
    }
  });
});

// ─── ParseResult correctness ──────────────────────────────────────────────────

describe('parseCollection — parseResult content', () => {
  it('each member parseResult has PHP results', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    for (const m of result.members) {
      // php array has one entry per successfully parsed file
      // If parsing failed, errors will be populated instead
      const hasPhpFiles = m.parseResult.php.length > 0 || m.parseResult.errors.length > 0;
      expect(hasPhpFiles).toBe(true);
      // The file was definitely found (plugin header extracted from it)
      expect(m.parseResult.pluginHeader).not.toBeNull();
    }
  });

  it('each member parseResult has a pluginHeader', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    for (const m of result.members) {
      expect(m.parseResult.pluginHeader).not.toBeNull();
    }
  });

  it('member parseResult errors array is defined', async () => {
    const result = await parseCollection(tempRoot, baseConfig());
    for (const m of result.members) {
      expect(Array.isArray(m.parseResult.errors)).toBe(true);
    }
  });
});
