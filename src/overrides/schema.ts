import { z } from 'zod';

// ─── Override Block Types ────────────────────────────────────────────────────

const TipBlock = z.object({
  type: z.literal('tip'),
  content: z.string(),
  variant: z.enum(['info', 'warning', 'success']).default('info'),
});

const CodeBlock = z.object({
  type: z.literal('code'),
  content: z.string(),
  label: z.string().optional(),
  language: z.string().default('php'),
});

export const OverrideBlockSchema = z.discriminatedUnion('type', [TipBlock, CodeBlock]);

export type OverrideBlock = z.infer<typeof OverrideBlockSchema>;

// ─── Overrides File Schema ───────────────────────────────────────────────────

const ItemOverrides = z.record(z.string(), z.array(OverrideBlockSchema));

/**
 * Top-level overrides file schema.
 *
 * Category keys match the reference sections in site-data.json.
 * Hooks use separate `actions` and `filters` keys to handle cases where
 * the same tag is used for both do_action() and apply_filters().
 */
export const OverridesFileSchema = z.object({
  functions: ItemOverrides.optional(),
  classes: ItemOverrides.optional(),
  constants: ItemOverrides.optional(),
  actions: ItemOverrides.optional(),
  filters: ItemOverrides.optional(),
  restEndpoints: ItemOverrides.optional(),
  js: ItemOverrides.optional(),
  cssTokens: ItemOverrides.optional(),
});

export type OverridesFile = z.infer<typeof OverridesFileSchema>;
