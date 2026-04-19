import { describe, it, expect } from 'vitest';
import { rewriteRefs } from '../guides/rewrite-refs.js';

describe('rewriteRefs', () => {
  const section = 'intro';
  const sourcePath = '/guides/intro/01-welcome.md';

  it('rewrites relative .md links to route paths', () => {
    const body = 'See [concepts](./02-concepts.md) for more.';
    const result = rewriteRefs(body, sourcePath, section, undefined);
    expect(result.body).toBe('See [concepts](/guides/intro/concepts) for more.');
    expect(result.assets).toHaveLength(0);
  });

  it('rewrites relative .mdx links to route paths', () => {
    const body = 'Read [advanced](./advanced-guide.mdx).';
    const result = rewriteRefs(body, sourcePath, section, undefined);
    expect(result.body).toBe('Read [advanced](/guides/intro/advanced-guide).');
  });

  it('strips numeric prefix from .md link targets', () => {
    const body = '[next](./03-setup.md)';
    const result = rewriteRefs(body, sourcePath, section, undefined);
    expect(result.body).toBe('[next](/guides/intro/setup)');
  });

  it('preserves absolute URLs', () => {
    const body = '[docs](https://example.com/docs)';
    const result = rewriteRefs(body, sourcePath, section, undefined);
    expect(result.body).toBe(body);
  });

  it('preserves anchor links', () => {
    const body = '[section](#overview)';
    const result = rewriteRefs(body, sourcePath, section, undefined);
    expect(result.body).toBe(body);
  });

  it('preserves root-relative links', () => {
    const body = '[home](/php/functions)';
    const result = rewriteRefs(body, sourcePath, section, undefined);
    expect(result.body).toBe(body);
  });

  it('includes subsection in rewritten links when provided', () => {
    const body = '[guide](./foo.md)';
    const result = rewriteRefs(body, '/guides/intro/hooks/custom.md', section, 'hooks');
    expect(result.body).toBe('[guide](/guides/intro/hooks/foo)');
  });
});
