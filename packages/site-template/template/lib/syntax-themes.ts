import type { PrismTheme } from 'prism-react-renderer';

/**
 * Custom Prism themes matching the design spec's syntax highlighting colors.
 * Dark theme for dark code backgrounds, light theme for light code backgrounds.
 * Both are selected at runtime by measuring --color-code-bg luminance.
 */

export const darkSyntaxTheme: PrismTheme = {
  plain: { color: '#e2e8f0', backgroundColor: 'transparent' },
  styles: [
    { types: ['keyword', 'tag', 'deleted'], style: { color: '#f472b6' } },
    { types: ['function', 'attr-name'], style: { color: '#38bdf8' } },
    { types: ['string', 'attr-value', 'template-string'], style: { color: '#fbbf24' } },
    { types: ['variable', 'regex'], style: { color: '#c4b5fd' } },
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#475569', fontStyle: 'italic' } },
    { types: ['number', 'boolean'], style: { color: '#34d399' } },
    { types: ['class-name', 'maybe-class-name', 'builtin'], style: { color: '#fb923c' } },
    { types: ['operator', 'punctuation'], style: { color: '#94a3b8' } },
    { types: ['property', 'constant'], style: { color: '#38bdf8' } },
    { types: ['inserted'], style: { color: '#34d399' } },
    { types: ['changed'], style: { color: '#fbbf24' } },
  ],
};

export const lightSyntaxTheme: PrismTheme = {
  plain: { color: '#334155', backgroundColor: 'transparent' },
  styles: [
    { types: ['keyword', 'tag', 'deleted'], style: { color: '#be185d' } },
    { types: ['function', 'attr-name'], style: { color: '#0369a1' } },
    { types: ['string', 'attr-value', 'template-string'], style: { color: '#b45309' } },
    { types: ['variable', 'regex'], style: { color: '#7c3aed' } },
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#94a3b8', fontStyle: 'italic' } },
    { types: ['number', 'boolean'], style: { color: '#047857' } },
    { types: ['class-name', 'maybe-class-name', 'builtin'], style: { color: '#c2410c' } },
    { types: ['operator', 'punctuation'], style: { color: '#64748b' } },
    { types: ['property', 'constant'], style: { color: '#0369a1' } },
    { types: ['inserted'], style: { color: '#047857' } },
    { types: ['changed'], style: { color: '#b45309' } },
  ],
};
