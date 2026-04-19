import type { JsDocParam, JsDocReturn, ParsedJsDocBlock } from './types.js';

/**
 * Strip leading " * " prefix from each line of a raw JSDoc comment block.
 * Input: the text inside /** ... *\/ (without the delimiters, as Babel provides it)
 * or the full comment string including delimiters.
 */
function stripDocComment(raw: string): string {
  // If raw starts with "/**" it's a full comment string; strip delimiters.
  // Babel leadingComments give the inner text (without /* and */).
  // We handle both forms.
  let text = raw;
  if (text.startsWith('/**') || text.startsWith('/*')) {
    text = text.replace(/^\/\*\*?\s*/, '').replace(/\s*\*\/$/, '');
  }
  return text
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

/**
 * Parse a JSDoc @param tag value.
 * Formats:
 *   {type} name description
 *   {type} [name] description  (optional param)
 *   {type} [name=default] description
 */
function parseParamTag(raw: string): JsDocParam {
  const trimmed = raw.trim();
  let rest = trimmed;
  let type: string | null = null;

  // Extract {type}
  const typeMatch = rest.match(/^\{([^}]*)\}\s*/);
  if (typeMatch) {
    type = typeMatch[1] ?? null;
    rest = rest.slice(typeMatch[0].length);
  }

  // Extract name — could be [name] or [name=default] (optional) or plain name
  const optionalMatch = rest.match(/^\[([^\]]*)\]\s*/);
  const plainMatch = rest.match(/^(\S+)\s*/);

  let name = '';
  let optional = false;

  if (optionalMatch) {
    // Strip default value: [name=default] → name
    name = (optionalMatch[1] ?? '').split('=')[0] ?? '';
    optional = true;
    rest = rest.slice(optionalMatch[0].length);
  } else if (plainMatch) {
    name = plainMatch[1] ?? '';
    rest = rest.slice(plainMatch[0].length);
  }

  // Strip leading " - " from description
  const description = rest.replace(/^-\s*/, '').trim();

  return { type, name, description, optional };
}

/**
 * Parse a JSDoc @returns/@return tag value.
 * Format: {type} description
 */
function parseReturnTag(raw: string): JsDocReturn {
  const trimmed = raw.trim();
  const typeMatch = trimmed.match(/^\{([^}]*)\}\s*/);
  if (typeMatch) {
    const type = typeMatch[1] ?? null;
    const description = trimmed.slice(typeMatch[0].length).replace(/^-\s*/, '').trim();
    return { type, description };
  }
  return { type: null, description: trimmed };
}

/**
 * Parse a raw JSDoc comment string into a structured {@link ParsedJsDocBlock}.
 *
 * Accepts either the inner text (as Babel provides in leadingComments) where
 * the comment content starts with `*`, or a full `/** ... *\/` string.
 */
export function parseJsDocBlock(rawComment: string): ParsedJsDocBlock {
  const stripped = stripDocComment(rawComment);
  const { description, tagLines } = splitDescriptionAndTags(stripped);

  const tags = tagLines.map((line) => {
    const match = line.match(/^@(\S+)\s*(.*)/s);
    return { tag: match?.[1] ?? '', raw: match?.[2]?.trim() ?? '' };
  });

  const params: JsDocParam[] = tags
    .filter((t) => t.tag === 'param')
    .map((t) => parseParamTag(t.raw));

  const returnTag = tags.find((t) => t.tag === 'returns' || t.tag === 'return');
  const returns = returnTag ? parseReturnTag(returnTag.raw) : undefined;

  const sinceTag = tags.find((t) => t.tag === 'since');
  const deprecatedTag = tags.find((t) => t.tag === 'deprecated');
  const throws = tags
    .filter((t) => t.tag === 'throws')
    .map((t) => {
      // Extract type from {type} if present, otherwise first word
      const typeMatch = t.raw.match(/^\{([^}]*)\}/);
      if (typeMatch) return typeMatch[1] ?? t.raw;
      return t.raw.split(/\s+/)[0] ?? t.raw;
    });

  return {
    description,
    since: sinceTag?.raw,
    deprecated: deprecatedTag?.raw,
    params,
    returns,
    throws,
    tags,
    raw: stripped,
  };
}
