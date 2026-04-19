/**
 * Parser for WordPress block.json manifest files.
 *
 * Parses the JSON manifest that describes a Gutenberg block's metadata,
 * attributes, supports, and asset references.
 */

export interface ParsedBlock {
  /** Fully-qualified block name, e.g. "my-plugin/my-block" */
  name: string;
  /** Human-readable block title */
  title: string;
  /** Block category slug (e.g. "common", "widgets", "text") */
  category?: string;
  /** Short description of the block */
  description?: string;
  /** Search keywords for the block inserter */
  keywords?: string[];
  /** WordPress block API version */
  apiVersion?: number;
  /** Block attribute definitions */
  attributes?: Record<string, { type: string; default?: unknown }>;
  /** Feature support flags */
  supports?: Record<string, unknown>;
  /** Editor script handle or file reference */
  editorScript?: string;
  /** Frontend style handle or file reference */
  style?: string;
  /** Absolute path to the block.json file */
  file: string;
}

/**
 * Parse a block.json file and return a {@link ParsedBlock} descriptor.
 *
 * Returns `null` if the content is not valid JSON or if the required `name`
 * field is absent.
 *
 * @param filePath - Absolute path to the block.json file (stored in result).
 * @param content  - Raw JSON string content of the file.
 */
export function parseBlockJson(filePath: string, content: string): ParsedBlock | null {
  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch {
    return null;
  }

  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // `name` is required — without it we cannot identify the block
  if (typeof obj['name'] !== 'string' || obj['name'].trim() === '') {
    return null;
  }

  const block: ParsedBlock = {
    name: obj['name'] as string,
    title: typeof obj['title'] === 'string' ? obj['title'] : '',
    file: filePath,
  };

  if (typeof obj['category'] === 'string') {
    block.category = obj['category'];
  }

  if (typeof obj['description'] === 'string') {
    block.description = obj['description'];
  }

  if (Array.isArray(obj['keywords'])) {
    block.keywords = (obj['keywords'] as unknown[]).filter(
      (k): k is string => typeof k === 'string'
    );
  }

  if (typeof obj['apiVersion'] === 'number') {
    block.apiVersion = obj['apiVersion'];
  }

  if (typeof obj['attributes'] === 'object' && obj['attributes'] !== null) {
    block.attributes = obj['attributes'] as Record<string, { type: string; default?: unknown }>;
  }

  if (typeof obj['supports'] === 'object' && obj['supports'] !== null) {
    block.supports = obj['supports'] as Record<string, unknown>;
  }

  if (typeof obj['editorScript'] === 'string') {
    block.editorScript = obj['editorScript'];
  }

  if (typeof obj['style'] === 'string') {
    block.style = obj['style'];
  }

  return block;
}
