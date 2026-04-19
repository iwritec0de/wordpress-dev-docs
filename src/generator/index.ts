import { resolve, basename, dirname } from 'path';
import { existsSync } from 'fs';
import type { CliFlags } from '../types/index.js';
import type { DocsConfig } from '../config/schema.js';
import { loadConfig, findConfig, resolveConfig } from '../config/loader.js';

/**
 * Resolve relative paths in a loaded config against the config file's directory.
 * Without this, paths like `source: "./"` resolve against cwd instead of
 * the directory containing the config file.
 */
function resolveConfigPaths(config: DocsConfig, configDir: string): DocsConfig {
  return {
    ...config,
    source: resolve(configDir, config.source),
    output: resolve(configDir, config.output),
    guides: config.guides ? resolve(configDir, config.guides) : config.guides,
    overrides: config.overrides ? resolve(configDir, config.overrides) : config.overrides,
    mcp: {
      ...config.mcp,
      output: resolve(configDir, config.mcp.output),
    },
  };
}
import { parseTarget } from '../parser/index.js';
import { parseGuides } from '../parser/guides/index.js';
import type { ParseResult } from '../parser/types.js';
import { buildMcpReference, writeMcpReference } from './mcp/index.js';
import type { McpReference } from './mcp/types.js';
import { scaffoldSite } from './site/index.js';
import type { ScaffoldResult } from './site/types.js';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface GenerateProgress {
  stage: 'config' | 'parse' | 'mcp' | 'scaffold' | 'done';
  message: string;
}

export interface GeneratePipelineOptions {
  /** The target directory path (from CLI arg, defaults to '.') */
  targetDir: string;
  /** CLI flags that may override config values */
  flags: CliFlags;
}

export interface GeneratePipelineResult {
  config: DocsConfig;
  parseResult: ParseResult;
  reference: McpReference;
  scaffoldResult: ScaffoldResult | null;
  mcpOutputPath: string | null;
  dryRun: boolean;
  warnings: string[];
}

// ─── Config resolution ────────────────────────────────────────────────────────

/**
 * Resolve the DocsConfig for a generate run.
 *
 * Priority:
 *   1. `flags.config` — explicit path to docs.config.json
 *   2. Auto-discovered docs.config.json (search up from targetDir)
 *   3. Synthesised minimal config from targetDir (no config file present)
 *
 * CLI flags are applied as overrides on top of the resolved config.
 */
function resolveRunConfig(
  targetDir: string,
  flags: CliFlags
): { config: DocsConfig; configDir: string } {
  const absTarget = resolve(targetDir);

  let base: DocsConfig;
  let configDir: string;

  if (flags.config) {
    // Explicit config path
    const configPath = resolve(flags.config);
    configDir = dirname(configPath);
    base = resolveConfigPaths(loadConfig(configPath), configDir);
  } else {
    // Auto-discover from target dir
    const found = findConfig(absTarget);
    if (found) {
      configDir = dirname(found);
      base = resolveConfigPaths(loadConfig(found), configDir);
    } else {
      // No config found — synthesise from target dir
      configDir = absTarget;
      const name = basename(absTarget);
      base = resolveConfig({
        name,
        source: absTarget,
        output: resolve(process.cwd(), `${name}-docs`),
      });
    }
  }

  // Apply CLI flag overrides
  const overrides: Partial<DocsConfig> = {};
  if (flags.output) overrides.output = resolve(flags.output);
  if (flags.guides) overrides.guides = resolve(flags.guides);
  if (flags.theme) overrides.theme = flags.theme;
  if (flags.skin) overrides.skin = flags.skin;
  if (flags.tokens) overrides.tokens = flags.tokens;
  if (flags.type) overrides.type = flags.type;
  if (flags.exclude) overrides.exclude = flags.exclude;

  if (Object.keys(overrides).length === 0) return { config: base, configDir };

  return { config: resolveConfig({ ...base, ...overrides }), configDir };
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Run the full generate pipeline:
 *   1. Resolve config
 *   2. Parse source files
 *   3. Build MCP reference
 *   4. Scaffold Next.js documentation site (skipped on --dry-run)
 *   5. Write MCP reference files (skipped on --dry-run, requires mcp.enabled)
 */
export async function runGenerate(
  options: GeneratePipelineOptions,
  onProgress?: (progress: GenerateProgress) => void
): Promise<GeneratePipelineResult> {
  const { targetDir, flags } = options;
  const dryRun = flags.dryRun ?? false;
  const warnings: string[] = [];

  // Stage 1: Config
  onProgress?.({ stage: 'config', message: 'Loading configuration…' });
  const { config, configDir } = resolveRunConfig(targetDir, flags);

  // Validate source directory exists
  const sourceRoot = resolve(config.source);
  if (!existsSync(sourceRoot)) {
    throw new Error(`Source directory not found: ${sourceRoot}`);
  }

  // Path safety: refuse to write into the source directory
  const outputRoot = resolve(config.output);
  if (outputRoot === sourceRoot) {
    throw new Error(
      `Output directory cannot be the same as source directory: ${outputRoot}\n` +
        `Use --output-dir to specify a different location.`
    );
  }

  // Stage 2: Parse
  onProgress?.({ stage: 'parse', message: `Parsing source files in ${sourceRoot}…` });
  const parseResult = await parseTarget(config);

  if (parseResult.errors.length > 0) {
    for (const err of parseResult.errors) {
      warnings.push(`Parse warning in ${err.file}: ${err.message}`);
    }
  }

  // Stage 2b: Parse guides (if configured)
  const guides = config.guides ? await parseGuides(resolve(config.guides)) : [];

  // Stage 3: Build MCP reference
  onProgress?.({ stage: 'mcp', message: 'Building MCP reference…' });
  const reference = buildMcpReference(parseResult);

  // Stage 4: Scaffold site (skip on dry-run)
  let scaffoldResult: ScaffoldResult | null = null;
  if (!dryRun) {
    const outputDir = resolve(config.output);
    onProgress?.({ stage: 'scaffold', message: `Scaffolding documentation site to ${outputDir}…` });
    const changelog = parseResult.readme?.changelog ?? [];
    scaffoldResult = scaffoldSite({ config, reference, outputDir, configDir, guides, changelog });
    warnings.push(...(scaffoldResult.warnings ?? []));
  } else {
    onProgress?.({ stage: 'scaffold', message: 'Dry run — skipping file output' });
  }

  // Stage 5: Write MCP reference (skip on dry-run)
  let mcpOutputPath: string | null = null;
  if (!dryRun && config.mcp.enabled) {
    mcpOutputPath = writeMcpReference(reference, resolve(config.mcp.output));
  }

  onProgress?.({ stage: 'done', message: 'Documentation generated successfully!' });

  return {
    config,
    parseResult,
    reference,
    scaffoldResult,
    mcpOutputPath,
    dryRun,
    warnings,
  };
}

// Re-export types
export type * from './mcp/types.js';
export type * from './site/types.js';
