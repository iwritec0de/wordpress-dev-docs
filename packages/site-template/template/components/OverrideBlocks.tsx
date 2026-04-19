'use client';

import { useState, useEffect, useRef } from 'react';
import { Highlight } from 'prism-react-renderer';
import { useTheme } from 'next-themes';
import { darkSyntaxTheme, lightSyntaxTheme } from '@/lib/syntax-themes';
import '@/lib/prism-php';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TipBlock {
  type: 'tip';
  content: string;
  variant: 'info' | 'warning' | 'success';
}

interface CodeBlock {
  type: 'code';
  content: string;
  label?: string;
  language: string;
}

export type OverrideBlock = TipBlock | CodeBlock;

// ─── Variant styles for tip blocks (matches Callout.tsx / design spec) ─────

const TIP_STYLES: Record<TipBlock['variant'], { bg: string; darkBg: string; iconColor: string }> = {
  info: {
    bg: 'bg-[var(--callout-info-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-info-outline)]',
    iconColor: 'text-accent',
  },
  warning: {
    bg: 'bg-[var(--callout-warn-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-warn-outline)]',
    iconColor: 'text-[var(--callout-warn-icon)]',
  },
  success: {
    bg: 'bg-[var(--callout-tip-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-tip-outline)]',
    iconColor: 'text-[var(--callout-tip-icon)]',
  },
};

// ─── Tip icons ──────────────────────────────────────────────────────────────

function TipIcon({ variant }: { variant: TipBlock['variant'] }) {
  if (variant === 'warning') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (variant === 'success') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    );
  }
  // info (default)
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Highlighted code block for override content. Detects code-bg brightness
 *  to pick the correct Prism theme (same approach as CodeBlock.tsx). */
function OverrideCode({ block }: { block: CodeBlock }) {
  const [copied, setCopied] = useState(false);
  const [codeBgIsDark, setCodeBgIsDark] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!ref.current) return;
    const raw = getComputedStyle(ref.current)
      .getPropertyValue('--color-code-bg')
      .trim()
      .replace('#', '');
    if (raw.length >= 6) {
      const r = parseInt(raw.substring(0, 2), 16);
      const g = parseInt(raw.substring(2, 4), 16);
      const b = parseInt(raw.substring(4, 6), 16);
      setCodeBgIsDark((0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5);
    }
  }, [resolvedTheme]);

  const theme = codeBgIsDark ? darkSyntaxTheme : lightSyntaxTheme;
  const code = block.content.replace(/\n+$/, '');

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  function handleCopy() {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard unavailable (insecure context, permission denied) — no-op.
      });
  }

  return (
    <div ref={ref} className="group rounded-md border border-border overflow-hidden">
      {block.label && (
        <div
          className="flex items-center bg-code-bg"
          style={{
            borderBottom:
              '1px solid color-mix(in srgb, var(--color-border) 30%, var(--color-code-bg))',
          }}
        >
          <span
            className="px-4 py-2 font-mono text-xs text-code-fg"
            style={{ boxShadow: 'inset 0 -2px 0 var(--color-accent)' }}
          >
            {block.label}
          </span>
        </div>
      )}
      <div className="relative">
        <Highlight theme={theme} code={code} language={block.language || 'text'}>
          {({ className, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className} overflow-x-auto bg-code-bg px-6 py-5 text-sm`}
              style={{ margin: 0, lineHeight: 1.7 }}
            >
              <code>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded px-2 py-1 font-sans text-xs opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background: 'color-mix(in srgb, var(--color-code-bg) 80%, var(--color-code-fg))',
            border: '1px solid color-mix(in srgb, var(--color-code-fg) 25%, var(--color-code-bg))',
            color: 'color-mix(in srgb, var(--color-code-fg) 60%, var(--color-code-bg))',
          }}
          aria-label="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function OverrideBlocks({ blocks }: { blocks: OverrideBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {blocks.map((block, i) => {
        if (block.type === 'tip') {
          const s = TIP_STYLES[block.variant];
          return (
            <div key={`tip-${i}-${block.variant}`} className={`flex gap-3 rounded-lg px-5 py-4 ${s.bg} ${s.darkBg}`}>
              <div className={`shrink-0 leading-[1.5] ${s.iconColor}`}>
                <TipIcon variant={block.variant} />
              </div>
              <div className="text-[0.9375rem]">{block.content}</div>
            </div>
          );
        }

        return <OverrideCode key={`code-${i}-${block.language}`} block={block} />;
      })}
    </div>
  );
}
