import { z } from 'zod';
import type { GuideFrontmatter } from './types.js';

/**
 * Zod schema for guide frontmatter. All fields optional; unknown keys are
 * ignored so users can add custom metadata without breaking parse.
 */
export const guideFrontmatterSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    section: z.string().optional(),
    hidden: z.boolean().optional(),
  })
  .passthrough();

export function parseFrontmatter(raw: unknown, sourcePath: string): GuideFrontmatter {
  const result = guideFrontmatterSchema.safeParse(raw ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(
      `Invalid frontmatter in ${sourcePath}: ${issue?.path.join('.') || '(root)'} — ${issue?.message ?? 'unknown'}`
    );
  }
  return result.data;
}
