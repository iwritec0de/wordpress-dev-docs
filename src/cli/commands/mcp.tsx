import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { resolve } from 'path';
import type { CliFlags } from '../../types/index.js';
import { runGenerate } from '../../generator/index.js';
import { createMcpServer } from '../../mcp-server/index.js';

export type McpTestStep = 'starting' | 'running' | 'error' | 'no-reference';

interface McpCommandProps {
  target: string;
  flags: CliFlags;
  _testStep?: McpTestStep;
}

const ENDPOINT_LIST = [
  'GET /                    → plugin metadata + endpoint list',
  'GET /functions           → all PHP functions',
  'GET /functions/:name     → single function',
  'GET /hooks               → all actions + filters',
  'GET /hooks/actions       → actions only',
  'GET /hooks/filters       → filters only',
  'GET /hooks/:name         → single hook',
  'GET /classes             → all classes',
  'GET /classes/:name       → single class',
  'GET /constants           → all constants',
  'GET /search?q=term       → search by name/description',
];

// ── Shared UI fragments ──────────────────────────────────────────────────────

function Heading() {
  return (
    <Text bold color="green">
      wpdocs mcp
    </Text>
  );
}

function RunningView({ port }: { port: number }) {
  return (
    <Box flexDirection="column">
      <Heading />
      <Text>
        MCP server running at{' '}
        <Text color="cyan" bold>
          http://localhost:{port}
        </Text>
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Available endpoints:</Text>
        {ENDPOINT_LIST.map((ep) => (
          <Text key={ep} dimColor>
            {'  '}
            {ep}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press Ctrl+C to stop.</Text>
      </Box>
    </Box>
  );
}

function StartingView({ port }: { port: number }) {
  return (
    <Box flexDirection="column">
      <Heading />
      <Text dimColor>Starting MCP server on port {port}…</Text>
    </Box>
  );
}

function NoReferenceView({ target }: { target: string }) {
  return (
    <Box flexDirection="column">
      <Heading />
      <Text color="red">No MCP reference found for: {target}</Text>
      <Text dimColor>Run &quot;wpdocs generate&quot; first, or provide a valid target.</Text>
    </Box>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <Box flexDirection="column">
      <Heading />
      <Text color="red">Error: {message}</Text>
    </Box>
  );
}

// ── Runtime component (hooks always called) ─────────────────────────────────

type Step = 'starting' | 'running' | 'error' | 'no-reference';

function McpRuntime({ target, flags, port }: { target: string; flags: CliFlags; port: number }) {
  const [step, setStep] = useState<Step>('starting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    let stopServer: (() => Promise<void>) | null = null;

    async function boot() {
      try {
        const targetDir = resolve(target || '.');

        // Run parse pipeline (config + parse + build MCP reference).
        // We use dryRun so no files are written to disk — we only need the
        // in-memory McpReference to feed to the HTTP server.
        const result = await runGenerate({ targetDir, flags: { ...flags, dryRun: true } });

        if (cancelled) return;

        const { reference } = result;

        // If the reference is essentially empty, treat as "no reference"
        if (
          reference.functions.length === 0 &&
          reference.classes.length === 0 &&
          reference.hooks.actions.length === 0 &&
          reference.hooks.filters.length === 0 &&
          reference.constants.length === 0 &&
          reference.restEndpoints.length === 0 &&
          reference.js.functions.length === 0
        ) {
          setStep('no-reference');
          return;
        }

        const pluginName = reference.name ?? 'WordPress Plugin';
        const server = createMcpServer({ reference, port, pluginName });
        // Assign before start() so cleanup can stop the server if the
        // component unmounts during startup (e.g. Ctrl+C).
        stopServer = () => server.stop();

        await server.start();

        if (cancelled) {
          await stopServer();
          return;
        }

        setStep('running');
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        setStep('error');
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (stopServer) void stopServer();
    };
  }, []);

  if (step === 'no-reference') return <NoReferenceView target={target} />;
  if (step === 'error') return <ErrorView message={errorMsg || 'Failed to start MCP server'} />;
  if (step === 'running') return <RunningView port={port} />;

  return <StartingView port={port} />;
}

// ── Main exported component ─────────────────────────────────────────────────

export function McpCommand({ target, flags, _testStep }: McpCommandProps) {
  const port = flags.port ?? (Number(process.env['MCP_PORT'] ?? 0) || 3000);

  // Test-step shortcuts (for ink-testing-library rendering tests)
  if (_testStep === 'no-reference') return <NoReferenceView target={target} />;
  if (_testStep === 'error') return <ErrorView message="Failed to start MCP server" />;
  if (_testStep === 'starting') return <StartingView port={port} />;
  if (_testStep === 'running') return <RunningView port={port} />;

  // Real runtime — delegates to a separate component so hooks are unconditional
  return <McpRuntime target={target} flags={flags} port={port} />;
}
