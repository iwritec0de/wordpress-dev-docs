import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Locate the wpdocs package root by walking up from the caller's directory
 * until we find the `packages/site-template/template` directory.
 *
 * This is resilient to both layouts we care about:
 *   - dev: src/generator/site/ → ../../../
 *   - bundled: dist/cli/       → ../../
 *   - installed: node_modules/@iwritec0de/wpdocs/dist/cli/ → ../../
 */
export function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'packages', 'site-template', 'template'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error(
    `Could not locate wpdocs package root from ${startDir}. ` +
      `Expected to find packages/site-template/template in an ancestor directory.`
  );
}

/** Convenience: package root resolved from a caller's import.meta.url. */
export function packageRootFrom(importMetaUrl: string): string {
  return findPackageRoot(dirname(fileURLToPath(importMetaUrl)));
}
