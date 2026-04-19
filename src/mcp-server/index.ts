import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import type { McpReference, McpFunction, McpHook, McpClass } from '../generator/mcp/types.js';

export interface McpServerOptions {
  port: number;
  reference: McpReference;
  pluginName: string;
}

/** Result of routing a single HTTP request — no I/O, purely functional. */
export interface RouteResult {
  status: number;
  body: unknown;
}

const ENDPOINTS = [
  'GET /',
  'GET /functions',
  'GET /functions/:name',
  'GET /hooks',
  'GET /hooks/actions',
  'GET /hooks/filters',
  'GET /hooks/:name',
  'GET /classes',
  'GET /classes/:name',
  'GET /constants',
  'GET /search?q=term',
];

/**
 * Pure route-handler function — no server, no I/O.
 * Exported for unit testing.
 */
export function handleRequest(
  method: string,
  pathname: string,
  query: URLSearchParams,
  reference: McpReference
): RouteResult {
  if (method !== 'GET') {
    return { status: 405, body: { error: 'Method Not Allowed' } };
  }

  // Strip trailing slash (except root)
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  // GET /
  if (path === '/') {
    return {
      status: 200,
      body: {
        name: reference.name,
        version: reference.version,
        description: reference.description,
        endpoints: ENDPOINTS,
      },
    };
  }

  // GET /functions
  if (path === '/functions') {
    return { status: 200, body: { functions: reference.functions } };
  }

  // GET /functions/:name
  const funcMatch = path.match(/^\/functions\/(.+)$/);
  if (funcMatch) {
    const name = decodeURIComponent(funcMatch[1]!);
    const fn: McpFunction | undefined = reference.functions.find((f) => f.name === name);
    if (!fn) return { status: 404, body: { error: `Function "${name}" not found` } };
    return { status: 200, body: fn };
  }

  // GET /hooks/actions
  if (path === '/hooks/actions') {
    return { status: 200, body: { actions: reference.hooks.actions } };
  }

  // GET /hooks/filters
  if (path === '/hooks/filters') {
    return { status: 200, body: { filters: reference.hooks.filters } };
  }

  // GET /hooks
  if (path === '/hooks') {
    return {
      status: 200,
      body: { actions: reference.hooks.actions, filters: reference.hooks.filters },
    };
  }

  // GET /hooks/:name
  const hookMatch = path.match(/^\/hooks\/(.+)$/);
  if (hookMatch) {
    const name = decodeURIComponent(hookMatch[1]!);
    const hook: McpHook | undefined = [...reference.hooks.actions, ...reference.hooks.filters].find(
      (h) => h.name === name
    );
    if (!hook) return { status: 404, body: { error: `Hook "${name}" not found` } };
    return { status: 200, body: hook };
  }

  // GET /classes
  if (path === '/classes') {
    return { status: 200, body: { classes: reference.classes } };
  }

  // GET /classes/:name
  const classMatch = path.match(/^\/classes\/(.+)$/);
  if (classMatch) {
    const name = decodeURIComponent(classMatch[1]!);
    const cls: McpClass | undefined = reference.classes.find((c) => c.name === name);
    if (!cls) return { status: 404, body: { error: `Class "${name}" not found` } };
    return { status: 200, body: cls };
  }

  // GET /constants
  if (path === '/constants') {
    return { status: 200, body: { constants: reference.constants } };
  }

  // GET /search?q=term
  if (path === '/search') {
    const term = (query.get('q') ?? '').toLowerCase().trim();
    if (!term) {
      return { status: 200, body: { results: [] } };
    }

    const matches: Array<{ kind: string; item: unknown }> = [];

    for (const fn of reference.functions) {
      if (fn.name.toLowerCase().includes(term) || fn.description.toLowerCase().includes(term)) {
        matches.push({ kind: 'function', item: fn });
      }
    }

    for (const hook of [...reference.hooks.actions, ...reference.hooks.filters]) {
      if (hook.name.toLowerCase().includes(term) || hook.description.toLowerCase().includes(term)) {
        matches.push({ kind: 'hook', item: hook });
      }
    }

    for (const cls of reference.classes) {
      if (cls.name.toLowerCase().includes(term) || cls.description.toLowerCase().includes(term)) {
        matches.push({ kind: 'class', item: cls });
      }
    }

    for (const constant of reference.constants) {
      if (
        constant.name.toLowerCase().includes(term) ||
        constant.description.toLowerCase().includes(term)
      ) {
        matches.push({ kind: 'constant', item: constant });
      }
    }

    return { status: 200, body: { results: matches } };
  }

  return { status: 404, body: { error: 'Not Found' } };
}

/** Create and manage an HTTP server that serves MCP reference data. */
export function createMcpServer(options: McpServerOptions): {
  start(): Promise<void>;
  stop(): Promise<void>;
  port: number;
} {
  const { port, reference } = options;

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const urlStr = req.url ?? '/';
    const base = `http://localhost:${port}`;
    let parsed: URL;
    try {
      parsed = new URL(urlStr, base);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Request' }));
      return;
    }

    const result = handleRequest(
      req.method ?? 'GET',
      parsed.pathname,
      parsed.searchParams,
      reference
    );

    res.writeHead(result.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body, null, 2));
  });

  return {
    port,

    start(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(port, () => resolve());
      });
    },

    stop(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
