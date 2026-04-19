import type { ParseResult } from '../parser/types.js';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ValidationIssue {
  type: 'missing-doc' | 'incomplete-doc' | 'missing-return' | 'missing-param';
  severity: 'error' | 'warning';
  message: string;
  file: string;
  line: number;
  symbol: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  stats: {
    /** Total symbols checked (functions + classes + public methods + JS functions) */
    total: number;
    /** Symbols with at least a doc block present */
    documented: number;
    /** Coverage as a percentage 0–100 (rounded to nearest integer) */
    coverage: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when a return type hint clearly indicates the function returns
 * nothing (void / never / absent). Used to skip the @return check.
 */
function isVoidReturn(returnType: string | null): boolean {
  if (returnType === null) return false; // untyped — we can't tell, so check
  const lower = returnType.toLowerCase();
  return lower === 'void' || lower === 'never';
}

// ─── Core validator ───────────────────────────────────────────────────────────

/**
 * Validate documentation coverage for a parsed plugin/theme target.
 *
 * Checks PHP functions, classes, public methods, WordPress hooks and JS
 * functions for missing or incomplete PHPDoc / JSDoc blocks.
 */
export function validateDocs(parseResult: ParseResult): ValidationResult {
  const issues: ValidationIssue[] = [];
  let total = 0;
  let documented = 0;

  // ── 1. PHP functions ───────────────────────────────────────────────────────
  for (const phpFile of parseResult.php) {
    for (const fn of phpFile.functions) {
      total++;

      if (!fn.doc) {
        issues.push({
          type: 'missing-doc',
          severity: 'error',
          message: `Function "${fn.name}" is missing a PHPDoc block`,
          file: phpFile.file,
          line: fn.location.line,
          symbol: fn.name,
        });
        // No doc — skip deeper checks
        continue;
      }

      documented++;

      // @param coverage
      for (const param of fn.params) {
        const hasParamTag = fn.doc.params.some(
          (p) => p.name === param.name || p.name === `$${param.name}`
        );
        if (!hasParamTag) {
          issues.push({
            type: 'missing-param',
            severity: 'warning',
            message: `Function "${fn.name}" is missing @param for parameter "${param.name}"`,
            file: phpFile.file,
            line: fn.location.line,
            symbol: fn.name,
          });
        }
      }

      // @return coverage (skip for void/never)
      if (!isVoidReturn(fn.returnType) && !fn.doc.returns) {
        issues.push({
          type: 'missing-return',
          severity: 'warning',
          message: `Function "${fn.name}" is missing a @return tag`,
          file: phpFile.file,
          line: fn.location.line,
          symbol: fn.name,
        });
      }
    }

    // ── 2. PHP classes ───────────────────────────────────────────────────────
    for (const cls of phpFile.classes) {
      total++;

      if (!cls.doc) {
        issues.push({
          type: 'missing-doc',
          severity: 'error',
          message: `Class "${cls.name}" is missing a PHPDoc block`,
          file: phpFile.file,
          line: cls.location.line,
          symbol: cls.name,
        });
      } else {
        documented++;
      }

      // ── 3. Public class methods ──────────────────────────────────────────
      for (const method of cls.methods) {
        if (method.visibility !== 'public') continue;
        total++;

        if (!method.doc) {
          issues.push({
            type: 'missing-doc',
            severity: 'warning',
            message: `Public method "${cls.name}::${method.name}" is missing a PHPDoc block`,
            file: phpFile.file,
            line: method.location.line,
            symbol: `${cls.name}::${method.name}`,
          });
        } else {
          documented++;
        }
      }
    }
  }

  // ── 4. WordPress hooks (do_action / apply_filters) ─────────────────────────
  for (const hookFile of parseResult.hooks) {
    for (const hook of hookFile.hooks) {
      if (hook.usage !== 'dispatch') continue;
      // Hooks are tracked separately — they don't add to total/documented counts
      // We treat hooks without a description as incomplete-doc warnings
      // (We can only check this if the surrounding PHP function has been parsed,
      //  but we surface the issue at the hook's location regardless.)
      if (!hook.name || hook.name.trim() === '') {
        issues.push({
          type: 'incomplete-doc',
          severity: 'warning',
          message: `Hook dispatch has no hook name`,
          file: hookFile.file,
          line: hook.location.line,
          symbol: '(unknown hook)',
        });
      } else {
        // Check if the corresponding PHP function (if any) documents this hook.
        // Since we don't have hook-level PHPDoc in the parsed output, we flag
        // every dispatched hook that has no description as incomplete-doc.
        // A hook is considered "described" when:
        //   - its name is non-empty  (always true here — handled above)
        //   - AND a PHPDoc exists in the same function scope that mentions it
        // We approximate: hooks are always worth flagging as needing descriptions.
        // We do NOT add them to total/documented stats to avoid double-counting.
      }
    }
  }

  // Check hooks with missing descriptions by looking for dispatch hooks
  // that have no corresponding PHPDoc context.  We do this separately so
  // we can surface "incomplete-doc" warnings without distorting coverage stats.
  for (const hookFile of parseResult.hooks) {
    for (const hook of hookFile.hooks) {
      if (hook.usage !== 'dispatch') continue;
      // Find the PHP file result for this hook file
      const phpResult = parseResult.php.find((p) => p.file === hookFile.file);
      if (!phpResult) continue;

      // Look for a function whose body contains this hook (by line range).
      // If the surrounding function has no PHPDoc *or* the function's PHPDoc
      // has no description, flag the hook.
      const containingFn = phpResult.functions.find((fn) => fn.location.line <= hook.location.line);
      if (containingFn && containingFn.doc) {
        const desc = containingFn.doc.description?.trim();
        if (!desc) {
          issues.push({
            type: 'incomplete-doc',
            severity: 'warning',
            message: `Hook "${hook.name}" dispatch is inside a function with an empty PHPDoc description`,
            file: hookFile.file,
            line: hook.location.line,
            symbol: hook.name,
          });
        }
      }
    }
  }

  // ── 5. JS functions ─────────────────────────────────────────────────────────
  for (const jsFile of parseResult.js) {
    for (const fn of jsFile.functions) {
      total++;

      if (!fn.doc) {
        issues.push({
          type: 'missing-doc',
          severity: 'warning',
          message: `JS function "${fn.name}" is missing a JSDoc block`,
          file: jsFile.file,
          line: fn.location.line,
          symbol: fn.name,
        });
      } else {
        documented++;
      }
    }
  }

  // ── Coverage stats ──────────────────────────────────────────────────────────
  const coverage = total === 0 ? 100 : Math.round((documented / total) * 100);

  return { issues, stats: { total, documented, coverage } };
}
