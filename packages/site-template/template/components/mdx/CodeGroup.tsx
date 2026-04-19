'use client';

import { useState, type ReactNode, type ReactElement, Children, isValidElement } from 'react';

interface CodeGroupProps {
  children: ReactNode;
}

/**
 * Groups multiple fenced code blocks with a tabbed interface.
 * Each child should be a `<pre>` element (as rendered from markdown code fences).
 * The tab label is extracted from `data-filename` or the language class.
 */
export function CodeGroup({ children }: CodeGroupProps) {
  const blocks = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const [active, setActive] = useState(0);

  const labels = blocks.map((block, i) => {
    // Try data-filename, then extract language from className
    const props = block.props as Record<string, unknown>;
    const pre = block.type === 'pre' ? props : null;
    const code = pre?.children as Record<string, unknown> | undefined;
    const codeProps = (
      code && typeof code === 'object' && 'props' in code ? code.props : undefined
    ) as Record<string, unknown> | undefined;
    const filename = (pre?.['data-filename'] ?? codeProps?.['data-filename']) as string | undefined;
    if (filename) return filename;
    const className: string = (codeProps?.className as string) ?? '';
    const lang = className.replace(/^language-/, '');
    return lang || `Tab ${i + 1}`;
  });

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex border-b border-border bg-code-bg">
        {labels.map((label, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-xs font-mono transition-colors ${
              i === active ? 'text-code-fg' : 'text-code-fg opacity-50 hover:opacity-75'
            }`}
            style={i === active ? { boxShadow: 'inset 0 -2px 0 var(--color-accent)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      <div>{blocks[active]}</div>
    </div>
  );
}
