import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { parse as parseYaml } from 'yaml';
import { OverridesFileSchema, type OverridesFile } from './schema.js';

// ─── Auto-discovery order ────────────────────────────────────────────────────

const AUTO_DISCOVER_FILES = ['overrides.yaml', 'overrides.yml', 'overrides.json'];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Load and validate an overrides file.
 *
 * Tries the explicit path from config first, then auto-discovers common
 * filenames in the config directory. Returns null if no file is found.
 *
 * @param configDir - Directory containing docs.config.json (used for auto-discovery)
 * @param configPath - Optional explicit path from the `overrides` config field
 * @returns Validated overrides or null if no file found
 * @throws {Error} if the file exists but has invalid content
 */
export function loadOverrides(configDir: string, configPath?: string): OverridesFile | null {
  const filePath = resolveOverridesPath(configDir, configPath);
  if (!filePath) return null;

  const raw = readFileSync(filePath, 'utf8');
  const ext = extname(filePath).toLowerCase();
  const data = ext === '.json' ? JSON.parse(raw) : parseYaml(raw);

  const result = OverridesFileSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid overrides file ${filePath}:\n${issues}`);
  }

  return result.data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveOverridesPath(configDir: string, configPath?: string): string | null {
  // Explicit path from config
  if (configPath) {
    const explicit = resolve(configDir, configPath);
    if (existsSync(explicit)) return explicit;
    throw new Error(`Overrides file not found: ${explicit}`);
  }

  // Auto-discover
  for (const name of AUTO_DISCOVER_FILES) {
    const candidate = resolve(configDir, name);
    if (existsSync(candidate)) return candidate;
  }

  return null;
}
