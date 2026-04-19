/**
 * Utilities for formatting error messages with clickable file:line:col paths.
 *
 * Most modern terminal emulators (iTerm2, VS Code terminal, Hyper, Windows Terminal)
 * auto-detect `file:line:col` patterns and make them clickable / Cmd-clickable.
 */

/**
 * Format a file path with optional line and column for terminal-clickable output.
 *
 * @example
 *   formatFileLine('/src/index.php')            // '/src/index.php'
 *   formatFileLine('/src/index.php', 42)         // '/src/index.php:42'
 *   formatFileLine('/src/index.php', 42, 10)     // '/src/index.php:42:10'
 */
export function formatFileLine(file: string, line?: number, col?: number): string {
  if (line == null) return file;
  if (col == null) return `${file}:${line}`;
  return `${file}:${line}:${col}`;
}

/**
 * Format a full error message with a clickable file:line:col path.
 *
 * @example
 *   formatError({ message: 'Unexpected token', file: '/src/index.php', line: 42 })
 *   // '/src/index.php:42 - Unexpected token'
 */
export function formatError(error: {
  message: string;
  file?: string;
  line?: number;
  col?: number;
}): string {
  if (!error.file) return error.message;
  const location = formatFileLine(error.file, error.line, error.col);
  return `${location} - ${error.message}`;
}
