import { z } from 'zod';

/**
 * Zod schema for docs.config.json
 *
 * Unknown fields are stripped (not passed through) — this keeps the validated
 * config object predictable and avoids accidental leakage of unrecognised keys.
 */
export const DocsConfigSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  type: z.enum(['plugin', 'theme', 'collection']).default('plugin'),
  source: z.string().default('./'),
  exclude: z.array(z.string()).default(['vendor/**', 'node_modules/**']),
  output: z.string().default('./docs-output'),
  /** Optional path to a folder of MDX guide content (F2). Relative to the config file. */
  guides: z.string().optional(),
  theme: z.string().default('default'),
  /** Skin name (built-in) or path to a custom skin JSON file. Overrides legacy `theme`. */
  skin: z.string().optional(),
  /** Path to a custom token overrides JSON file. Layered on top of the selected skin. */
  tokens: z.string().optional(),
  /** Path to a YAML/JSON file with user-supplied tips and code examples for reference items. */
  overrides: z.string().optional(),
  site: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      baseUrl: z.string().default('/'),
      logo: z.string().optional(),
      /** GitHub repository URL — shown as an icon link in the top nav. */
      githubUrl: z.string().url().optional(),
      /** External links appended to the top navigation bar (e.g. Support, Blog). */
      navLinks: z
        .array(
          z.object({
            label: z.string(),
            href: z
              .string()
              .refine(
                (v) => v.startsWith('/') || v.startsWith('https://') || v.startsWith('http://'),
                { message: 'navLink href must be a relative path or http(s) URL' }
              ),
          })
        )
        .optional(),
    })
    .default({ baseUrl: '/' }),
  mcp: z
    .object({
      enabled: z.boolean().default(false),
      output: z.string().default('./mcp-reference'),
    })
    .default({ enabled: false, output: './mcp-reference' }),
  groups: z
    .array(
      z.object({
        name: z.string(),
        plugins: z.array(z.string()),
      })
    )
    .default([]),
});

export type DocsConfig = z.infer<typeof DocsConfigSchema>;
