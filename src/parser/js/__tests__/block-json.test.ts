import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseBlockJson } from '../block-json.js';
import type { ParsedBlock } from '../block-json.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dir, '../__fixtures__/block.json');

const validJson = JSON.stringify({
  apiVersion: 2,
  name: 'my-plugin/my-block',
  title: 'My Block',
  category: 'common',
  description: 'A simple block',
  keywords: ['my', 'block'],
  attributes: {
    content: { type: 'string', default: '' },
  },
  supports: { html: false },
  editorScript: 'file:./index.js',
  style: 'file:./style-index.css',
});

describe('parseBlockJson — core fields', () => {
  it('parses block name', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('my-plugin/my-block');
  });

  it('parses title', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.title).toBe('My Block');
  });

  it('parses category', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.category).toBe('common');
  });

  it('parses description', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.description).toBe('A simple block');
  });

  it('parses keywords array', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.keywords).toEqual(['my', 'block']);
  });

  it('parses apiVersion', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.apiVersion).toBe(2);
  });

  it('parses attributes object', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.attributes).toBeDefined();
    expect(result!.attributes!['content']).toEqual({ type: 'string', default: '' });
  });

  it('parses supports object', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.supports).toBeDefined();
    expect(result!.supports!['html']).toBe(false);
  });

  it('parses editorScript', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.editorScript).toBe('file:./index.js');
  });

  it('parses style', () => {
    const result = parseBlockJson('/path/block.json', validJson);
    expect(result!.style).toBe('file:./style-index.css');
  });

  it('stores the file path in result', () => {
    const filePath = '/absolute/path/to/block.json';
    const result = parseBlockJson(filePath, validJson);
    expect(result!.file).toBe(filePath);
  });
});

describe('parseBlockJson — error cases', () => {
  it('returns null for invalid JSON', () => {
    const result = parseBlockJson('/path/block.json', '{ not valid json ');
    expect(result).toBeNull();
  });

  it('returns null when name field is missing', () => {
    const noName = JSON.stringify({ title: 'My Block', apiVersion: 2 });
    const result = parseBlockJson('/path/block.json', noName);
    expect(result).toBeNull();
  });

  it('returns null when name is an empty string', () => {
    const emptyName = JSON.stringify({ name: '', title: 'My Block' });
    const result = parseBlockJson('/path/block.json', emptyName);
    expect(result).toBeNull();
  });

  it('returns null for a JSON array (not an object)', () => {
    const result = parseBlockJson('/path/block.json', '[]');
    expect(result).toBeNull();
  });
});

describe('parseBlockJson — optional fields', () => {
  it('returns undefined category when not present', () => {
    const minimal = JSON.stringify({ name: 'ns/block', title: 'Block' });
    const result = parseBlockJson('/path/block.json', minimal);
    expect(result).not.toBeNull();
    expect(result!.category).toBeUndefined();
  });

  it('returns undefined keywords when not present', () => {
    const minimal = JSON.stringify({ name: 'ns/block', title: 'Block' });
    const result = parseBlockJson('/path/block.json', minimal);
    expect(result!.keywords).toBeUndefined();
  });

  it('omits non-string entries from keywords array', () => {
    const mixed = JSON.stringify({
      name: 'ns/block',
      title: 'Block',
      keywords: ['valid', 42, null, 'also-valid'],
    });
    const result = parseBlockJson('/path/block.json', mixed);
    expect(result!.keywords).toEqual(['valid', 'also-valid']);
  });
});

describe('parseBlockJson — fixture file', () => {
  it('parses the fixture block.json end-to-end', () => {
    const content = readFileSync(fixturePath, 'utf8');
    const result = parseBlockJson(fixturePath, content) as ParsedBlock;

    expect(result).not.toBeNull();
    expect(result.name).toBe('example-plugin/example-block');
    expect(result.title).toBe('Example Block');
    expect(result.category).toBe('widgets');
    expect(result.description).toBe('An example Gutenberg block');
    expect(result.keywords).toEqual(['example', 'test']);
    expect(result.apiVersion).toBe(2);
    expect(result.attributes).toBeDefined();
    expect(result.attributes!['message']).toEqual({ type: 'string', default: '' });
    expect(result.attributes!['align']).toEqual({ type: 'string', default: 'none' });
    expect(result.supports).toEqual({ html: false, align: true });
    expect(result.editorScript).toBe('file:./index.js');
    expect(result.style).toBe('file:./style-index.css');
    expect(result.file).toBe(fixturePath);
  });

  it('fixture file path is stored correctly in result', () => {
    const content = readFileSync(fixturePath, 'utf8');
    const result = parseBlockJson(fixturePath, content);
    expect(result!.file).toBe(fixturePath);
  });
});
