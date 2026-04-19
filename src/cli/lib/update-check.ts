import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** How often to check for updates (7 days in ms). */
const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** Timeout for the registry fetch (3 seconds). */
const FETCH_TIMEOUT_MS = 3000;

/** npm registry URL for the package. */
const REGISTRY_URL = 'https://registry.npmjs.org/wpdocs/latest';

interface CacheEntry {
  timestamp: number;
  latestVersion: string;
}

/**
 * Returns the path to the update-check cache file.
 * Allows override via parameter for testing.
 */
export function getCachePath(cacheDir?: string): string {
  const dir = cacheDir ?? join(homedir(), '.cache', 'wpdocs');
  return join(dir, 'update-check.json');
}

/**
 * Read the cached update-check data. Returns null if missing or corrupt.
 */
function readCache(cachePath: string): CacheEntry | null {
  try {
    const raw = readFileSync(cachePath, 'utf-8');
    const data: unknown = JSON.parse(raw);
    if (
      typeof data === 'object' &&
      data !== null &&
      'timestamp' in data &&
      'latestVersion' in data &&
      typeof (data as CacheEntry).timestamp === 'number' &&
      typeof (data as CacheEntry).latestVersion === 'string'
    ) {
      return data as CacheEntry;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write update-check data to the cache file, creating parent dirs if needed.
 */
function writeCache(cachePath: string, entry: CacheEntry): void {
  try {
    const dir = cachePath.replace(/[/\\][^/\\]+$/, '');
    mkdirSync(dir, { recursive: true });
    writeFileSync(cachePath, JSON.stringify(entry), 'utf-8');
  } catch {
    // Silently ignore write failures (read-only fs, permissions, etc.)
  }
}

/**
 * Compare two semver-like version strings. Returns true if `latest` is newer than `current`.
 * Only handles numeric dot-separated versions (e.g. "1.2.3").
 */
function isNewer(current: string, latest: string): boolean {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] ?? 0;
    const lv = l[i] ?? 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

/**
 * Fetch the latest version from the npm registry.
 * Uses a 3-second timeout via AbortController.
 */
async function fetchLatestVersion(registryUrl?: string): Promise<string | null> {
  const url = registryUrl ?? REGISTRY_URL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    return typeof data.version === 'string' ? data.version : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface UpdateCheckOptions {
  /** Override cache directory for testing. */
  cacheDir?: string;
  /** Override registry URL for testing. */
  registryUrl?: string;
  /** Override "now" timestamp for testing. */
  now?: number;
}

/**
 * Check whether a newer version of wpdocs is available on npm.
 *
 * - Returns null when opted out (`WPDOCS_NO_UPDATE_CHECK=1` or `CI` env var set).
 * - Caches the check result for 7 days.
 * - Never throws — all errors are swallowed silently.
 * - Uses a 3-second fetch timeout so it never blocks the CLI meaningfully.
 */
export async function checkForUpdate(
  currentVersion: string,
  options: UpdateCheckOptions = {}
): Promise<string | null> {
  try {
    // Opt-out checks
    if (process.env['WPDOCS_NO_UPDATE_CHECK'] === '1') return null;
    if (process.env['CI']) return null;
    if (!process.stdout.isTTY) return null;

    const cachePath = getCachePath(options.cacheDir);
    const now = options.now ?? Date.now();

    // Check cache freshness
    const cached = readCache(cachePath);
    if (cached && now - cached.timestamp < CHECK_INTERVAL_MS) {
      // Cache is fresh — use cached version
      if (isNewer(currentVersion, cached.latestVersion)) {
        return `Update available: ${currentVersion} → ${cached.latestVersion}. Run: npm i -g wpdocs`;
      }
      return null;
    }

    // Fetch from registry
    const latestVersion = await fetchLatestVersion(options.registryUrl);
    if (!latestVersion) return null;

    // Update cache
    writeCache(cachePath, { timestamp: now, latestVersion });

    if (isNewer(currentVersion, latestVersion)) {
      return `Update available: ${currentVersion} → ${latestVersion}. Run: npm i -g wpdocs`;
    }

    return null;
  } catch {
    // Never let update checks break the CLI
    return null;
  }
}
