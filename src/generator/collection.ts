import { writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { parseCollection } from '../parser/collection.js';
import { buildMcpReference, writeMcpReference } from './mcp/index.js';
import { scaffoldSite } from './site/index.js';
import type { DocsConfig } from '../config/schema.js';
import type { CollectionMember, CollectionResult } from '../parser/collection.js';
import type { McpReference } from './mcp/types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CollectionGenerateResult {
  /** Root output directory */
  outputDir: string;
  /** Number of member plugins processed */
  memberCount: number;
  /** All files written across the entire collection */
  filesWritten: string[];
  /** Path to combined MCP reference (null if mcp not enabled) */
  combinedMcpPath: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function write(filePath: string, content: string): void {
  mkdirSync(resolve(filePath, '..'), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

/** Generate a minimal HTML index page listing all plugins */
function genCollectionIndex(
  config: DocsConfig,
  collection: CollectionResult,
  references: Array<{ member: CollectionMember; reference: McpReference }>
): string {
  const title = config.site.title ?? config.name;
  const rows = references
    .map(({ member, reference }) => {
      const fnCount = reference.functions.length;
      const classCount = reference.classes.length;
      const hookCount = reference.hooks.actions.length + reference.hooks.filters.length;
      return `      <tr>
        <td><a href="./${member.slug}/">${htmlEscape(member.name)}</a></td>
        <td>${htmlEscape(reference.version ?? '')}</td>
        <td>${fnCount} fn / ${classCount} class / ${hookCount} hooks</td>
        <td><code>${htmlEscape(member.slug)}</code></td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${htmlEscape(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    p.subtitle { color: #6b7280; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.5rem 1rem; background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
    td { padding: 0.5rem 1rem; border-bottom: 1px solid #f3f4f6; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-size: 0.875em; background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>${htmlEscape(title)}</h1>
  <p class="subtitle">${collection.members.length} plugin${collection.members.length !== 1 ? 's' : ''} documented</p>
  <table>
    <thead>
      <tr><th>Plugin</th><th>Version</th><th>Summary</th><th>Slug</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>
`;
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Generate documentation for a collection of plugins.
 *
 * - Parses all plugin subdirectories under `rootDir`
 * - Scaffolds a per-plugin Next.js site under `outputDir/<slug>/`
 * - Writes a top-level `index.html` overview
 * - Optionally writes a combined `mcp-reference.json` at the output root
 */
export async function generateCollection(
  rootDir: string,
  config: DocsConfig,
  outputDir: string
): Promise<CollectionGenerateResult> {
  const absoluteOutput = resolve(outputDir);
  const filesWritten: string[] = [];

  // 1. Parse all members
  const collection = await parseCollection(rootDir, config);

  // 2. Build MCP references and scaffold per-member sites
  const memberRefs: Array<{ member: CollectionMember; reference: McpReference }> = [];

  for (const member of collection.members) {
    const reference = buildMcpReference(member.parseResult);
    memberRefs.push({ member, reference });

    const memberOutputDir = join(absoluteOutput, member.slug);

    // Scaffold the per-member Next.js site
    const result = scaffoldSite({
      config: member.parseResult.config,
      reference,
      outputDir: memberOutputDir,
      changelog: member.parseResult.readme?.changelog ?? [],
    });
    filesWritten.push(...result.filesWritten);

    // Write per-member MCP reference if enabled
    if (config.mcp.enabled) {
      const mcpPath = writeMcpReference(reference, join(memberOutputDir, 'mcp-reference.json'));
      filesWritten.push(mcpPath);
    }
  }

  // 3. Build the collection nav (for potential embedding in site-data)
  // TODO: buildCollectionNav was removed — re-implement when collection mode is wired to CLI

  // 4. Write top-level index.html
  const indexPath = join(absoluteOutput, 'index.html');
  write(indexPath, genCollectionIndex(config, collection, memberRefs));
  filesWritten.push(indexPath);

  // 5. Write combined MCP reference if enabled
  let combinedMcpPath: string | null = null;
  if (config.mcp.enabled) {
    const combined: McpReference = {
      name: config.name,
      version: config.version ?? null,
      description: config.site.description ?? null,
      functions: memberRefs.flatMap(({ reference }) => reference.functions),
      classes: memberRefs.flatMap(({ reference }) => reference.classes),
      constants: memberRefs.flatMap(({ reference }) => reference.constants),
      hooks: {
        actions: memberRefs.flatMap(({ reference }) => reference.hooks.actions),
        filters: memberRefs.flatMap(({ reference }) => reference.hooks.filters),
      },
      restEndpoints: memberRefs.flatMap(({ reference }) => reference.restEndpoints),
      restFields: memberRefs.flatMap(({ reference }) => reference.restFields),
      js: { functions: memberRefs.flatMap(({ reference }) => reference.js.functions) },
      cssTokens: memberRefs.flatMap(({ reference }) => reference.cssTokens),
    };
    combinedMcpPath = join(absoluteOutput, 'mcp-reference.json');
    write(combinedMcpPath, json(combined));
    filesWritten.push(combinedMcpPath);
  }

  // 6. Write a collection manifest
  const manifestPath = join(absoluteOutput, 'collection.json');
  write(
    manifestPath,
    json({
      name: config.name,
      generatedAt: new Date().toISOString(),
      members: collection.members.map((m) => ({
        name: m.name,
        slug: m.slug,
        directory: m.directory,
        href: `./${m.slug}/`,
      })),
      groups: collection.groups,
    })
  );
  filesWritten.push(manifestPath);

  return {
    outputDir: absoluteOutput,
    memberCount: collection.members.length,
    filesWritten,
    combinedMcpPath,
  };
}
