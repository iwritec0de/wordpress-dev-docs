import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type ZodIssue } from 'zod';
import { DocsConfigSchema, type DocsConfig } from './schema.js';

/**
 * Thrown when config loading or validation fails.
 * `issues` is populated when the failure is a Zod validation error.
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly issues?: ZodIssue[]
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Format Zod issues into a human-readable string.
 */
function formatIssues(issues: ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Load and validate docs.config.json from the given absolute path.
 * Returns a fully-typed, default-applied config or throws ConfigError.
 */
export function loadConfig(configPath: string): DocsConfig {
  // 1. Read file
  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf-8');
  } catch {
    throw new ConfigError(
      `Config file not found: ${configPath}\n` +
        `Run "wpdocs init" to create a docs.config.json in your project.`
    );
  }

  // 2. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError(`Invalid JSON in config file: ${configPath}`);
  }

  // 3. Validate with Zod
  return resolveConfig(parsed, configPath);
}

/**
 * Find docs.config.json by searching from targetDir upward.
 * Returns the absolute path if found, or null if not found.
 */
export function findConfig(targetDir: string): string | null {
  let current = targetDir;

  while (true) {
    const candidate = join(current, 'docs.config.json');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);
    // Stop when we've reached the filesystem root
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

/**
 * Validate and apply defaults to a raw config object.
 * Throws ConfigError if validation fails.
 * Useful for merging CLI flag overrides on top of a loaded config.
 */
export function resolveConfig(raw: unknown, sourcePath?: string): DocsConfig {
  const result = DocsConfigSchema.safeParse(raw);

  if (!result.success) {
    const source = sourcePath ? ` in ${sourcePath}` : '';
    const details = formatIssues(result.error.issues);
    throw new ConfigError(`Config validation failed${source}:\n${details}`, result.error.issues);
  }

  return result.data;
}
