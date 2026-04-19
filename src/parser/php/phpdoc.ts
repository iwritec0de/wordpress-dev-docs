import type { DocParam, DocReturn, DocTag, ParsedDocBlock } from './types.js';

/**
 * Strip leading " * " prefix from each line of a raw PHPDoc comment block.
 * Input: "/**\n * Description\n * @param string $x\n *\/"
 */
function stripDocComment(raw: string): string {
  return raw
    .replace(/^\/\*\*?\s*/, '')
    .replace(/\s*\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();
}

/**
 * Split stripped comment text into a description block and a list of @tag lines.
 * Multi-line tag values are collapsed onto the first tag line.
 */
function splitDescriptionAndTags(text: string): {
  description: string;
  tagLines: string[];
} {
  const lines = text.split('\n');
  const descLines: string[] = [];
  const tagLines: string[] = [];
  let inTags = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('@')) {
      inTags = true;
      tagLines.push(line.trim());
    } else if (inTags && tagLines.length > 0) {
      // Continuation line — append to last tag
      tagLines[tagLines.length - 1] += ' ' + line.trim();
    } else {
      descLines.push(line);
    }
  }

  return {
    description: descLines.join('\n').trim(),
    tagLines,
  };
}

function parseParamTag(raw: string): DocParam {
  // Format: [type] [$name] [description]
  // e.g. "string $key The setting key" or "mixed $default Default value." or "$key"
  const parts = raw.trim().split(/\s+/);
  let type = 'mixed';
  let name = '';
  let descStart = 0;

  if (parts[0] && !parts[0]!.startsWith('$')) {
    type = parts[0]!;
    descStart = 1;
  }

  if (parts[descStart] && parts[descStart]!.startsWith('$')) {
    name = parts[descStart]!.slice(1);
    descStart += 1;
  }

  const description = parts.slice(descStart).join(' ');
  const optional =
    type.startsWith('?') || type.includes('null') || description.toLowerCase().includes('optional');

  return { type: type.replace(/^\?/, ''), name, description, optional };
}

function parseReturnTag(raw: string): DocReturn {
  const parts = raw.trim().split(/\s+/);
  const type = parts[0] ?? 'void';
  const description = parts.slice(1).join(' ');
  return { type, description };
}

/**
 * Parse a raw PHPDoc comment string into a structured {@link ParsedDocBlock}.
 */
export function parseDocBlock(rawComment: string): ParsedDocBlock {
  const stripped = stripDocComment(rawComment);
  const { description, tagLines } = splitDescriptionAndTags(stripped);

  const tags: DocTag[] = tagLines.map((line) => {
    const match = line.match(/^@(\S+)\s*(.*)/s);
    return { tag: match?.[1] ?? '', raw: match?.[2]?.trim() ?? '' };
  });

  const params: DocParam[] = tags.filter((t) => t.tag === 'param').map((t) => parseParamTag(t.raw));

  const returnTag = tags.find((t) => t.tag === 'return');
  const returns = returnTag ? parseReturnTag(returnTag.raw) : undefined;

  const sinceTag = tags.find((t) => t.tag === 'since');
  const deprecatedTag = tags.find((t) => t.tag === 'deprecated');
  const varTag = tags.find((t) => t.tag === 'var');
  const throws = tags.filter((t) => t.tag === 'throws').map((t) => t.raw.split(/\s+/)[0] ?? t.raw);

  return {
    description,
    since: sinceTag?.raw,
    deprecated: deprecatedTag?.raw,
    params,
    returns,
    throws,
    varType: varTag?.raw.split(/\s+/)[0],
    tags,
    raw: stripped,
  };
}
