import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractRestEndpoints, extractRestFields } from '../rest-api.js';
import { parseTarget } from '../../index.js';
import { buildMcpReference } from '../../../generator/mcp/index.js';
import type { DocsConfig } from '../../../config/schema.js';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const EXAMPLE_PLUGIN_REST_API = resolve(
  __dir,
  '../../../../examples/example-plugin/includes/rest-api.php'
);
const EXAMPLE_PLUGIN_DIR = resolve(__dir, '../../../../examples/example-plugin');

function writeTempPhp(content: string): string {
  const dir = join(tmpdir(), `rest-api-test-${process.pid}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'test.php');
  writeFileSync(file, content, 'utf8');
  return file;
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe('extractRestEndpoints', () => {
  it('detects register_rest_route calls in the example-plugin fixture', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('extracts the correct namespace from the fixture', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    const namespaces = endpoints.map((e) => e.namespace);
    expect(namespaces.every((ns) => ns === 'example-plugin/v1')).toBe(true);
  });

  it('extracts a /settings route', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    const routes = endpoints.map((e) => e.route);
    expect(routes).toContain('/settings');
  });

  it('extracts a /status route', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    const routes = endpoints.map((e) => e.route);
    expect(routes).toContain('/status');
  });

  it('builds fullRoute as namespace + route', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    for (const ep of endpoints) {
      expect(ep.fullRoute).toBe(`${ep.namespace}${ep.route}`);
    }
  });

  it('resolves WP_REST_Server::READABLE to GET', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    const getEndpoints = endpoints.filter((e) => e.methods.includes('GET'));
    expect(getEndpoints.length).toBeGreaterThan(0);
  });

  it('resolves WP_REST_Server::CREATABLE to POST', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    const postEndpoints = endpoints.filter((e) => e.methods.includes('POST'));
    expect(postEndpoints.length).toBeGreaterThan(0);
  });

  it('stores the file path on each endpoint', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    for (const ep of endpoints) {
      expect(ep.file).toBe(EXAMPLE_PLUGIN_REST_API);
    }
  });

  it('stores a non-zero line number on each endpoint', () => {
    const endpoints = extractRestEndpoints(EXAMPLE_PLUGIN_REST_API);
    for (const ep of endpoints) {
      expect(ep.line).toBeGreaterThan(0);
    }
  });

  it('returns empty array when file has no register_rest_route calls', () => {
    const file = writeTempPhp('<?php echo "hello";');
    const endpoints = extractRestEndpoints(file);
    expect(endpoints).toEqual([]);
  });

  it('extracts a single method from a string literal', () => {
    const file = writeTempPhp(`<?php
register_rest_route('myplugin/v1', '/items', array(
  'methods' => 'GET',
  'callback' => 'my_callback',
  'permission_callback' => '__return_true',
));
`);
    const endpoints = extractRestEndpoints(file);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].methods).toEqual(['GET']);
  });

  it('extracts multiple methods from an array', () => {
    const file = writeTempPhp(`<?php
register_rest_route('myplugin/v1', '/items', array(
  'methods' => array('GET', 'POST'),
  'callback' => 'my_callback',
  'permission_callback' => '__return_true',
));
`);
    const endpoints = extractRestEndpoints(file);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].methods).toContain('GET');
    expect(endpoints[0].methods).toContain('POST');
  });

  it('extracts the callback name when it is a string', () => {
    const file = writeTempPhp(`<?php
register_rest_route('myplugin/v1', '/items', array(
  'methods' => 'GET',
  'callback' => 'my_get_items',
  'permission_callback' => '__return_true',
));
`);
    const endpoints = extractRestEndpoints(file);
    expect(endpoints[0].callback).toBe('my_get_items');
  });

  it('extracts the permission_callback name when it is a string', () => {
    const file = writeTempPhp(`<?php
register_rest_route('myplugin/v1', '/items', array(
  'methods' => 'GET',
  'callback' => 'my_callback',
  'permission_callback' => 'my_permission_check',
));
`);
    const endpoints = extractRestEndpoints(file);
    expect(endpoints[0].permissionCallback).toBe('my_permission_check');
  });

  it('handles multiple register_rest_route calls in one file', () => {
    const file = writeTempPhp(`<?php
register_rest_route('ns/v1', '/a', array(
  'methods' => 'GET',
  'callback' => 'cb_a',
  'permission_callback' => '__return_true',
));
register_rest_route('ns/v1', '/b', array(
  'methods' => 'POST',
  'callback' => 'cb_b',
  'permission_callback' => '__return_true',
));
`);
    const endpoints = extractRestEndpoints(file);
    expect(endpoints).toHaveLength(2);
    const routes = endpoints.map((e) => e.route);
    expect(routes).toContain('/a');
    expect(routes).toContain('/b');
  });
});

// ─── Integration tests ────────────────────────────────────────────────────────

describe('parseTarget REST endpoint integration', () => {
  it('includes restEndpoints in ParseResult for example-plugin', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const result = await parseTarget(config);
    expect(result.restEndpoints).toBeDefined();
    expect(result.restEndpoints.length).toBeGreaterThan(0);
  });

  it('restEndpoints contain the example-plugin namespace', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const result = await parseTarget(config);
    const namespaces = result.restEndpoints.map((e) => e.namespace);
    expect(namespaces).toContain('example-plugin/v1');
  });
});

// ─── MCP reference integration ────────────────────────────────────────────────

describe('buildMcpReference REST endpoints', () => {
  it('includes restEndpoints array in McpReference', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const parseResult = await parseTarget(config);
    const ref = buildMcpReference(parseResult);
    expect(ref.restEndpoints).toBeDefined();
    expect(Array.isArray(ref.restEndpoints)).toBe(true);
    expect(ref.restEndpoints.length).toBeGreaterThan(0);
  });

  it('McpReference restEndpoints have expected shape', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const parseResult = await parseTarget(config);
    const ref = buildMcpReference(parseResult);
    for (const ep of ref.restEndpoints) {
      expect(typeof ep.namespace).toBe('string');
      expect(typeof ep.route).toBe('string');
      expect(typeof ep.fullRoute).toBe('string');
      expect(Array.isArray(ep.methods)).toBe(true);
      expect(typeof ep.description).toBe('string');
      expect(typeof ep.file).toBe('string');
      expect(typeof ep.line).toBe('number');
    }
  });
});

// ─── extractRestFields unit tests ────────────────────────────────────────────

describe('extractRestFields', () => {
  it('detects register_rest_field calls in the example-plugin fixture', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    expect(fields.length).toBeGreaterThan(0);
  });

  it('extracts the correct objectType and fieldName', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    const postMeta = fields.find((f) => f.fieldName === 'example_meta');
    expect(postMeta).toBeDefined();
    expect(postMeta!.objectType).toBe('post');
  });

  it('extracts schema description, type, and context', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    const postMeta = fields.find((f) => f.fieldName === 'example_meta' && f.objectType === 'post');
    expect(postMeta).toBeDefined();
    expect(postMeta!.description).toBe('Example custom meta field added to posts.');
    expect(postMeta!.type).toBe('string');
    expect(postMeta!.context).toEqual(['view', 'edit']);
  });

  it('detects get_callback and update_callback presence', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    const postMeta = fields.find((f) => f.fieldName === 'example_meta');
    expect(postMeta!.hasGetCallback).toBe(true);
    expect(postMeta!.hasUpdateCallback).toBe(true);
  });

  it('emits one RestField per object type when first arg is an array', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    const readingTimeFields = fields.filter((f) => f.fieldName === 'example_reading_time');
    expect(readingTimeFields).toHaveLength(2);
    const types = readingTimeFields.map((f) => f.objectType).sort();
    expect(types).toEqual(['page', 'post']);
  });

  it('handles missing update_callback gracefully', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    const readingTime = fields.find(
      (f) => f.fieldName === 'example_reading_time' && f.objectType === 'post'
    );
    expect(readingTime).toBeDefined();
    expect(readingTime!.hasGetCallback).toBe(true);
    expect(readingTime!.hasUpdateCallback).toBe(false);
  });

  it('returns empty array when file has no register_rest_field calls', () => {
    const file = writeTempPhp('<?php echo "hello";');
    const fields = extractRestFields(file);
    expect(fields).toEqual([]);
  });

  it('handles missing schema gracefully', () => {
    const file = writeTempPhp(`<?php
register_rest_field( 'post', 'bare_field', array(
  'get_callback' => 'my_get_cb',
) );
`);
    const fields = extractRestFields(file);
    expect(fields).toHaveLength(1);
    expect(fields[0].fieldName).toBe('bare_field');
    expect(fields[0].description).toBe('');
    expect(fields[0].type).toBe('');
    expect(fields[0].context).toEqual([]);
    expect(fields[0].hasGetCallback).toBe(true);
    expect(fields[0].hasUpdateCallback).toBe(false);
  });

  it('stores file path and line number', () => {
    const fields = extractRestFields(EXAMPLE_PLUGIN_REST_API);
    for (const f of fields) {
      expect(f.file).toBe(EXAMPLE_PLUGIN_REST_API);
      expect(f.line).toBeGreaterThan(0);
    }
  });
});

// ─── extractRestFields integration ───────────────────────────────────────────

describe('parseTarget REST field integration', () => {
  it('includes restFields in ParseResult for example-plugin', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const result = await parseTarget(config);
    expect(result.restFields).toBeDefined();
    expect(result.restFields.length).toBeGreaterThan(0);
  });
});

describe('buildMcpReference REST fields', () => {
  it('includes restFields array in McpReference', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const parseResult = await parseTarget(config);
    const ref = buildMcpReference(parseResult);
    expect(ref.restFields).toBeDefined();
    expect(Array.isArray(ref.restFields)).toBe(true);
    expect(ref.restFields.length).toBeGreaterThan(0);
  });

  it('McpReference restFields have expected shape', async () => {
    const config: DocsConfig = {
      name: 'example-plugin',
      source: EXAMPLE_PLUGIN_DIR,
      output: '/tmp/docs-out',
      type: 'plugin',
      exclude: [],
    };
    const parseResult = await parseTarget(config);
    const ref = buildMcpReference(parseResult);
    for (const f of ref.restFields) {
      expect(typeof f.objectType).toBe('string');
      expect(typeof f.fieldName).toBe('string');
      expect(typeof f.description).toBe('string');
      expect(typeof f.type).toBe('string');
      expect(Array.isArray(f.context)).toBe(true);
      expect(typeof f.hasGetCallback).toBe('boolean');
      expect(typeof f.hasUpdateCallback).toBe('boolean');
      expect(typeof f.file).toBe('string');
      expect(typeof f.line).toBe('number');
    }
  });
});
