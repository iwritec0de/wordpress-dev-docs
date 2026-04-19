import { describe, it, expect } from 'vitest';
import { formatFileLine, formatError } from '../format-error.js';

describe('formatFileLine', () => {
  it('returns file only when no line given', () => {
    expect(formatFileLine('/src/index.php')).toBe('/src/index.php');
  });

  it('returns file:line when line is given', () => {
    expect(formatFileLine('/src/index.php', 42)).toBe('/src/index.php:42');
  });

  it('returns file:line:col when both given', () => {
    expect(formatFileLine('/src/index.php', 42, 10)).toBe('/src/index.php:42:10');
  });

  it('ignores col when line is not provided', () => {
    expect(formatFileLine('/src/index.php', undefined, 10)).toBe('/src/index.php');
  });

  it('handles line 0 as a valid line number', () => {
    expect(formatFileLine('/src/index.php', 0)).toBe('/src/index.php:0');
  });
});

describe('formatError', () => {
  it('returns just the message when no file', () => {
    expect(formatError({ message: 'Something broke' })).toBe('Something broke');
  });

  it('formats with file and message', () => {
    expect(formatError({ message: 'Parse error', file: '/src/index.php' })).toBe(
      '/src/index.php - Parse error'
    );
  });

  it('formats with file, line, and message', () => {
    expect(formatError({ message: 'Unexpected token', file: '/src/index.php', line: 42 })).toBe(
      '/src/index.php:42 - Unexpected token'
    );
  });

  it('formats with file, line, col, and message', () => {
    expect(
      formatError({ message: 'Unexpected token', file: '/src/index.php', line: 42, col: 10 })
    ).toBe('/src/index.php:42:10 - Unexpected token');
  });
});
