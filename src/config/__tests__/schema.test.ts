import { describe, it, expect } from 'vitest';
import { DocsConfigSchema } from '../schema.js';

describe('DocsConfigSchema', () => {
  describe('valid configs', () => {
    it('accepts a minimal config with just name', () => {
      const result = DocsConfigSchema.safeParse({ name: 'My Plugin' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Plugin');
      }
    });

    it('accepts a full config', () => {
      const full = {
        name: 'My Plugin',
        version: '1.2.3',
        type: 'plugin',
        source: './src',
        exclude: ['vendor/**', 'tests/**'],
        output: './custom-output',
        theme: 'dark',
        site: {
          title: 'My Plugin Docs',
          description: 'Documentation for My Plugin',
          baseUrl: '/docs',
          logo: './logo.png',
        },
        mcp: {
          enabled: true,
          output: './mcp-out',
        },
        groups: [{ name: 'Core', plugins: ['plugin-a', 'plugin-b'] }],
      };
      const result = DocsConfigSchema.safeParse(full);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('plugin');
        expect(result.data.mcp.enabled).toBe(true);
        expect(result.data.groups).toHaveLength(1);
      }
    });
  });

  describe('defaults', () => {
    it('defaults type to "plugin"', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('plugin');
      }
    });

    it('defaults output to "./docs-output"', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe('./docs-output');
      }
    });

    it('defaults source to "./"', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('./');
      }
    });

    it('defaults exclude to vendor and node_modules globs', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exclude).toEqual(['vendor/**', 'node_modules/**']);
      }
    });

    it('defaults theme to "default"', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.theme).toBe('default');
      }
    });

    it('defaults mcp.enabled to false', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mcp.enabled).toBe(false);
      }
    });

    it('defaults mcp.output to "./mcp-reference"', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mcp.output).toBe('./mcp-reference');
      }
    });

    it('defaults site.baseUrl to "/"', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.site.baseUrl).toBe('/');
      }
    });

    it('defaults groups to an empty array', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groups).toEqual([]);
      }
    });
  });

  describe('validation failures', () => {
    it('fails when name is missing', () => {
      const result = DocsConfigSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('name');
      }
    });

    it('fails when type is an invalid enum value', () => {
      const result = DocsConfigSchema.safeParse({ name: 'Test', type: 'widget' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('type');
      }
    });

    it('fails when mcp.enabled is not a boolean', () => {
      const result = DocsConfigSchema.safeParse({
        name: 'Test',
        mcp: { enabled: 'yes' },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('mcp.enabled');
      }
    });
  });

  describe('unknown fields', () => {
    it('strips unknown fields from the output', () => {
      const result = DocsConfigSchema.safeParse({
        name: 'Test',
        unknownField: 'should be removed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
      }
    });
  });
});
