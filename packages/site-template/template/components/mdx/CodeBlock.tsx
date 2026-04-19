'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Highlight } from 'prism-react-renderer';
import { useTheme } from 'next-themes';
import { darkSyntaxTheme, lightSyntaxTheme } from '@/lib/syntax-themes';
import '@/lib/prism-php';

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
  'data-filename'?: string;
}

/**
 * Enhanced code block with Prism syntax highlighting and copy button.
 * Receives <pre> props from MDX — children is typically a <code> element.
 *
 * Strategy: render {children} directly during SSR to avoid hydration mismatch
 * (RSC-serialized React elements can't be introspected for text on the client).
 * After mount, read text + language from the DOM and switch to Highlight.
 */
export function CodeBlock({
  children,
  className,
  'data-filename': filename,
  ...rest
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState<{
    code: string;
    language: string;
  } | null>(null);
  const [codeBgIsDark, setCodeBgIsDark] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const { resolvedTheme } = useTheme();

  // After mount, read code text and language from the rendered DOM, then
  // switch to Prism-highlighted output. This avoids hydration mismatches
  // caused by React element introspection differing between server and client.
  useEffect(() => {
    if (!preRef.current) return;
    const codeEl = preRef.current.querySelector('code');
    const text = (codeEl?.textContent ?? preRef.current.textContent ?? '').replace(/\n+$/, '');
    const lang = codeEl?.className?.match(/language-(\w+)/)?.[1] ?? 'text';
    setHighlighted({ code: text, language: lang });
  }, []);

  // Detect actual code-bg brightness so the Prism syntax theme matches the
  // background regardless of the site's light/dark mode. Most skins use a dark
  // code-bg even in light mode, so we can't rely on resolvedTheme.
  useEffect(() => {
    if (!containerRef.current) return;
    const raw = getComputedStyle(containerRef.current)
      .getPropertyValue('--color-code-bg')
      .trim();
    const hex = raw.replace('#', '');
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      setCodeBgIsDark(luminance < 0.5);
    }
  }, [resolvedTheme, highlighted]);

  const prismTheme = codeBgIsDark ? darkSyntaxTheme : lightSyntaxTheme;

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  function handleCopy() {
    const text = highlighted?.code
      ?? preRef.current?.textContent?.replace(/\n+$/, '')
      ?? '';
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard unavailable (insecure context, permission denied) — no-op.
      });
  }

  const preClasses = `${className ?? ''} ${filename ? 'rounded-t-none' : ''} bg-code-bg overflow-x-auto px-6 py-5 text-sm`;
  const preStyle = {
    margin: 0,
    borderRadius: filename ? 0 : undefined,
    lineHeight: 1.7,
  };

  return (
    <div ref={containerRef} className="group relative my-4 overflow-hidden border border-border rounded-md">
      {filename && (
        <div
          className="flex items-center bg-code-bg"
          style={{
            borderBottom:
              '1px solid color-mix(in srgb, var(--color-border) 30%, var(--color-code-bg))',
          }}
        >
          <span
            className="px-4 py-2 font-mono text-xs text-code-fg"
            style={{
              boxShadow: 'inset 0 -2px 0 var(--color-accent)',
            }}
          >
            {filename}
          </span>
        </div>
      )}
      <div className="relative">
        {highlighted ? (
          <Highlight theme={prismTheme} code={highlighted.code} language={highlighted.language}>
            {({ className: hlClassName, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${hlClassName} ${preClasses}`}
                style={preStyle}
                {...rest}
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
        ) : (
          <pre
            ref={preRef}
            className={preClasses}
            style={{ ...preStyle, color: 'var(--color-code-fg)' }}
            {...rest}
          >
            {children}
          </pre>
        )}
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
