import type { McpReference } from '../generator/mcp/types.js';
import type { OverridesFile, OverrideBlock } from './schema.js';

/**
 * Merge user-supplied overrides into an MCP reference in-place.
 *
 * Matches override targets to reference items by name (case-insensitive).
 * Attaches an `overrides` array to each matched item. Logs warnings for
 * override targets that don't match any reference item.
 *
 * @returns Array of warning messages for unmatched override targets
 */
export function mergeOverrides(reference: McpReference, overrides: OverridesFile): string[] {
  const warnings: string[] = [];

  // Functions
  if (overrides.functions) {
    warnings.push(...matchAndAttach(overrides.functions, reference.functions, 'name', 'functions'));
  }

  // Classes
  if (overrides.classes) {
    warnings.push(...matchAndAttach(overrides.classes, reference.classes, 'name', 'classes'));
  }

  // Constants
  if (overrides.constants) {
    warnings.push(...matchAndAttach(overrides.constants, reference.constants, 'name', 'constants'));
  }

  // Actions
  if (overrides.actions) {
    warnings.push(...matchAndAttach(overrides.actions, reference.hooks.actions, 'name', 'actions'));
  }

  // Filters
  if (overrides.filters) {
    warnings.push(...matchAndAttach(overrides.filters, reference.hooks.filters, 'name', 'filters'));
  }

  // REST endpoints (match by fullRoute)
  if (overrides.restEndpoints) {
    warnings.push(
      ...matchAndAttach(
        overrides.restEndpoints,
        reference.restEndpoints,
        'fullRoute',
        'restEndpoints'
      )
    );
  }

  // JS functions
  if (overrides.js) {
    warnings.push(...matchAndAttach(overrides.js, reference.js.functions, 'name', 'js'));
  }

  // CSS tokens
  if (overrides.cssTokens) {
    warnings.push(...matchAndAttach(overrides.cssTokens, reference.cssTokens, 'name', 'cssTokens'));
  }

  return warnings;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Match override entries to reference items by a key field (case-insensitive)
 * and attach the override blocks.
 *
 * The generic bound requires the item type to carry an optional `overrides` field
 * so the attachment is type-checked (see McpOverrideBlock in generator/mcp/types.ts).
 */
function matchAndAttach<
  T extends { [K in F]: string } & { overrides?: OverrideBlock[] },
  F extends string,
>(
  overrideMap: Record<string, OverrideBlock[]>,
  items: T[],
  keyField: F,
  category: string
): string[] {
  const warnings: string[] = [];

  // Build a lowercase lookup index
  const index = new Map<string, T>();
  for (const item of items) {
    const key = String(item[keyField]).toLowerCase();
    index.set(key, item);
  }

  for (const [targetName, blocks] of Object.entries(overrideMap)) {
    const item = index.get(targetName.toLowerCase());
    if (item) {
      item.overrides = blocks;
    } else {
      warnings.push(`Override target "${targetName}" not found in ${category} — check spelling`);
    }
  }

  return warnings;
}
