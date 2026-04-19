import { describe, it, expect } from 'vitest';
import { parseDocBlock } from '../phpdoc.js';

const docWithParams = `/**
 * Gets the plugin settings.
 *
 * @since 1.0.0
 * @param string $key     The setting key.
 * @param mixed  $default Default value.
 * @return mixed The setting value.
 */`;

const deprecatedDoc = `/**
 * Old function.
 *
 * @since 1.0.0
 * @deprecated 2.0.0 Use new_function() instead.
 * @return void
 */`;

const varDoc = `/**
 * Plugin version.
 *
 * @var string
 * @since 1.0.0
 */`;

const throwsDoc = `/**
 * Risky operation.
 *
 * @throws RuntimeException When something goes wrong.
 * @throws InvalidArgumentException If key is empty.
 * @return bool
 */`;

describe('parseDocBlock', () => {
  it('extracts description', () => {
    const result = parseDocBlock(docWithParams);
    expect(result.description).toBe('Gets the plugin settings.');
  });

  it('extracts @since', () => {
    const result = parseDocBlock(docWithParams);
    expect(result.since).toBe('1.0.0');
  });

  it('extracts @param tags', () => {
    const result = parseDocBlock(docWithParams);
    expect(result.params).toHaveLength(2);
    expect(result.params[0]).toMatchObject({ type: 'string', name: 'key' });
    expect(result.params[1]).toMatchObject({ type: 'mixed', name: 'default' });
  });

  it('extracts @return', () => {
    const result = parseDocBlock(docWithParams);
    expect(result.returns).toMatchObject({ type: 'mixed', description: 'The setting value.' });
  });

  it('extracts @deprecated', () => {
    const result = parseDocBlock(deprecatedDoc);
    expect(result.deprecated).toContain('2.0.0');
  });

  it('extracts @var type', () => {
    const result = parseDocBlock(varDoc);
    expect(result.varType).toBe('string');
  });

  it('extracts @throws', () => {
    const result = parseDocBlock(throwsDoc);
    expect(result.throws).toHaveLength(2);
    expect(result.throws[0]).toBe('RuntimeException');
    expect(result.throws[1]).toBe('InvalidArgumentException');
  });

  it('returns empty params for a doc with no @param', () => {
    const result = parseDocBlock(varDoc);
    expect(result.params).toHaveLength(0);
  });

  it('handles doc with no description (only tags)', () => {
    const result = parseDocBlock(`/** @since 1.0.0 */`);
    expect(result.since).toBe('1.0.0');
    expect(result.description).toBe('');
  });
});
