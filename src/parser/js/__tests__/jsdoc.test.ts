import { describe, it, expect } from 'vitest';
import { parseJsDocBlock } from '../jsdoc.js';

// Full JSDoc strings (as you'd write them in source)
const docWithParams = `/**
 * Initializes the plugin.
 * @since 1.0.0
 * @param {string} slug - Plugin slug.
 * @param {Object} [options] - Optional config.
 * @returns {boolean} True on success.
 */`;

const deprecatedDoc = `/**
 * Old helper function.
 *
 * @since 1.0.0
 * @deprecated 2.0.0 Use newHelper() instead.
 * @returns {void}
 */`;

const throwsDoc = `/**
 * Risky operation.
 *
 * @throws {RuntimeException} When something goes wrong.
 * @throws {InvalidArgumentException} If arg is empty.
 * @returns {boolean}
 */`;

const multilineDesc = `/**
 * First line of description.
 * Second line continues here.
 * @since 1.0.0
 */`;

const noDescDoc = `/**
 * @since 2.0.0
 * @param {string} name - The name.
 */`;

const returnsAltTag = `/**
 * Gets a value.
 * @return {string} The value.
 */`;

describe('parseJsDocBlock', () => {
  describe('description', () => {
    it('extracts single-line description', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.description).toBe('Initializes the plugin.');
    });

    it('extracts multi-line description', () => {
      const result = parseJsDocBlock(multilineDesc);
      expect(result.description).toContain('First line');
      expect(result.description).toContain('Second line');
    });

    it('returns empty string when no description', () => {
      const result = parseJsDocBlock(noDescDoc);
      expect(result.description).toBe('');
    });
  });

  describe('@since', () => {
    it('extracts @since tag', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.since).toBe('1.0.0');
    });

    it('returns undefined when no @since', () => {
      const result = parseJsDocBlock(throwsDoc);
      expect(result.since).toBeUndefined();
    });
  });

  describe('@param', () => {
    it('extracts typed param', () => {
      const result = parseJsDocBlock(docWithParams);
      const param = result.params[0]!;
      expect(param.type).toBe('string');
      expect(param.name).toBe('slug');
      expect(param.optional).toBe(false);
    });

    it('extracts optional param with bracket notation', () => {
      const result = parseJsDocBlock(docWithParams);
      const param = result.params[1]!;
      expect(param.name).toBe('options');
      expect(param.optional).toBe(true);
    });

    it('extracts param description', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.params[0]!.description).toBe('Plugin slug.');
    });

    it('extracts multiple params', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.params).toHaveLength(2);
    });

    it('returns empty params array when no @param tags', () => {
      const result = parseJsDocBlock(deprecatedDoc);
      expect(result.params).toHaveLength(0);
    });
  });

  describe('@returns', () => {
    it('extracts @returns type', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.returns?.type).toBe('boolean');
    });

    it('extracts @returns description', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.returns?.description).toBe('True on success.');
    });

    it('supports @return (without s)', () => {
      const result = parseJsDocBlock(returnsAltTag);
      expect(result.returns?.type).toBe('string');
      expect(result.returns?.description).toBe('The value.');
    });

    it('returns undefined when no @returns', () => {
      const result = parseJsDocBlock(noDescDoc);
      expect(result.returns).toBeUndefined();
    });
  });

  describe('@deprecated', () => {
    it('extracts @deprecated tag', () => {
      const result = parseJsDocBlock(deprecatedDoc);
      expect(result.deprecated).toContain('2.0.0');
    });

    it('returns undefined when not deprecated', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.deprecated).toBeUndefined();
    });
  });

  describe('@throws', () => {
    it('extracts @throws types', () => {
      const result = parseJsDocBlock(throwsDoc);
      expect(result.throws).toHaveLength(2);
      expect(result.throws[0]).toBe('RuntimeException');
      expect(result.throws[1]).toBe('InvalidArgumentException');
    });

    it('returns empty array when no @throws', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.throws).toHaveLength(0);
    });
  });

  describe('raw', () => {
    it('stores stripped raw text', () => {
      const result = parseJsDocBlock(docWithParams);
      expect(result.raw).toContain('Initializes the plugin.');
      expect(result.raw).not.toContain('/**');
    });
  });

  describe('Babel inner-text format', () => {
    // Babel provides comment value WITHOUT the /* */ delimiters
    // The value starts with `*` for a JSDoc block
    it('handles inner comment text as provided by Babel', () => {
      const innerText = `*
 * Formats a value.
 * @since 1.1.0
 * @param {number} amount - The amount.
 * @returns {string} Formatted string.
 `;
      const result = parseJsDocBlock('/*' + innerText + '*/');
      expect(result.description).toBe('Formats a value.');
      expect(result.since).toBe('1.1.0');
      expect(result.params).toHaveLength(1);
      expect(result.returns?.type).toBe('string');
    });
  });
});
