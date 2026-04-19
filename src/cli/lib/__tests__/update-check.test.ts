import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkForUpdate } from '../update-check.js';

// Helper: create a temp cache dir for each test
function makeTmpCacheDir(): string {
  return mkdtempSync(join(tmpdir(), 'wpdocs-update-check-'));
}

// Helper: write a fake cache file
function writeCache(cacheDir: string, data: { timestamp: number; latestVersion: string }): void {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, 'update-check.json'), JSON.stringify(data), 'utf-8');
}

describe('checkForUpdate', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    // Ensure TTY so the check runs
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    });
    delete process.env['WPDOCS_NO_UPDATE_CHECK'];
    delete process.env['CI'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('returns null when WPDOCS_NO_UPDATE_CHECK is set', async () => {
    process.env['WPDOCS_NO_UPDATE_CHECK'] = '1';
    const result = await checkForUpdate('1.0.0');
    expect(result).toBeNull();
  });

  it('returns null when CI env var is set', async () => {
    process.env['CI'] = 'true';
    const result = await checkForUpdate('1.0.0');
    expect(result).toBeNull();
  });

  it('returns null when cache is fresh (< 7 days old) and versions match', async () => {
    const cacheDir = makeTmpCacheDir();
    const now = Date.now();
    // Cache written 1 day ago with same version
    writeCache(cacheDir, { timestamp: now - 1 * 24 * 60 * 60 * 1000, latestVersion: '1.0.0' });

    const result = await checkForUpdate('1.0.0', { cacheDir, now });
    expect(result).toBeNull();
  });

  it('returns update message from fresh cache when newer version exists', async () => {
    const cacheDir = makeTmpCacheDir();
    const now = Date.now();
    // Cache written 1 day ago with newer version
    writeCache(cacheDir, { timestamp: now - 1 * 24 * 60 * 60 * 1000, latestVersion: '2.0.0' });

    const result = await checkForUpdate('1.0.0', { cacheDir, now });
    expect(result).toContain('Update available');
    expect(result).toContain('1.0.0');
    expect(result).toContain('2.0.0');
  });

  it('returns update message when registry reports newer version (mock fetch)', async () => {
    const cacheDir = makeTmpCacheDir();
    const now = Date.now();

    // Mock global fetch to return a newer version
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '3.5.0' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await checkForUpdate('1.0.0', { cacheDir, now });
    expect(result).toContain('Update available');
    expect(result).toContain('1.0.0');
    expect(result).toContain('3.5.0');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when registry reports same version', async () => {
    const cacheDir = makeTmpCacheDir();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await checkForUpdate('1.0.0', { cacheDir });
    expect(result).toBeNull();
  });

  it('returns null when fetch fails (network error)', async () => {
    const cacheDir = makeTmpCacheDir();

    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await checkForUpdate('1.0.0', { cacheDir });
    expect(result).toBeNull();
  });

  it('returns null when registry returns non-ok response', async () => {
    const cacheDir = makeTmpCacheDir();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await checkForUpdate('1.0.0', { cacheDir });
    expect(result).toBeNull();
  });

  it('returns null when stdout is not a TTY', async () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });

    const result = await checkForUpdate('1.0.0');
    expect(result).toBeNull();
  });

  it('fetches from registry when cache is stale (> 7 days old)', async () => {
    const cacheDir = makeTmpCacheDir();
    const now = Date.now();
    // Cache written 8 days ago
    writeCache(cacheDir, {
      timestamp: now - 8 * 24 * 60 * 60 * 1000,
      latestVersion: '1.0.0',
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '2.0.0' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await checkForUpdate('1.0.0', { cacheDir, now });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toContain('Update available');
    expect(result).toContain('2.0.0');
  });
});
