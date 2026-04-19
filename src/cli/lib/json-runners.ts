/**
 * Headless JSON runners for `--json` mode.
 *
 * These bypass Ink rendering entirely and write a single JSON object to stdout
 * so the output can be consumed by CI pipelines and other tooling.
 */

import { resolve, basename } from 'path';
import { runGenerate } from '../../generator/index.js';
import { parseTarget } from '../../parser/index.js';
import { validateDocs } from '../../validator/index.js';
import { loadConfig, findConfig, resolveConfig } from '../../config/loader.js';
import type { DocsConfig } from '../../config/schema.js';
import { RUNTIME_ERROR, VALIDATION_FAILURE } from './exit-codes.js';
import type { CliFlags } from '../../types/index.js';

// ─── generate ────────────────────────────────────────────────────────────────

export function runJsonGenerate(targetDir: string, flags: CliFlags): void {
  const start = Date.now();

  runGenerate({ targetDir, flags })
    .then((result) => {
      const output = {
        success: true,
        outputDir: result.scaffoldResult?.outputDir ?? null,
        filesWritten: result.scaffoldResult?.filesWritten.length ?? 0,
        dryRun: result.dryRun,
        duration: Date.now() - start,
      };
      console.log(JSON.stringify(output));
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.log(JSON.stringify({ success: false, error: message, duration: Date.now() - start }));
      process.exitCode = RUNTIME_ERROR;
    });
}

// ─── validate ────────────────────────────────────────────────────────────────

export function runJsonValidate(targetDir: string, flags: CliFlags): void {
  (async () => {
    try {
      const absTarget = resolve(targetDir);

      // Load config: explicit path > auto-discover > synthesise from target
      let config: DocsConfig;
      if (flags.config) {
        const configPath = resolve(flags.config);
        config = loadConfig(configPath);
      } else {
        const found = findConfig(absTarget);
        if (found) {
          config = loadConfig(found);
        } else {
          config = resolveConfig({
            name: basename(absTarget),
            source: absTarget,
          });
        }
      }

      // Apply CLI flag overrides
      const overrides: Partial<DocsConfig> = {};
      if (flags.type) overrides.type = flags.type;
      if (flags.exclude) overrides.exclude = flags.exclude;

      if (Object.keys(overrides).length > 0) {
        config = resolveConfig({ ...config, ...overrides });
      }

      // Ensure source points at the target directory
      config = { ...config, source: absTarget };

      const parsed = await parseTarget(config);
      const result = validateDocs(parsed);

      const errors = result.issues.filter((i) => i.severity === 'error');
      const warnings = result.issues.filter((i) => i.severity === 'warning');

      const output = {
        valid: errors.length === 0,
        errors: errors.map((e) => ({
          type: e.type,
          file: e.file,
          line: e.line,
          symbol: e.symbol,
          message: e.message,
        })),
        warnings: warnings.map((w) => ({
          type: w.type,
          file: w.file,
          line: w.line,
          symbol: w.symbol,
          message: w.message,
        })),
        stats: result.stats,
      };

      console.log(JSON.stringify(output));

      if (errors.length > 0) {
        process.exitCode = VALIDATION_FAILURE;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(JSON.stringify({ valid: false, error: message }));
      process.exitCode = RUNTIME_ERROR;
    }
  })();
}
