import React, { useEffect, useState, useRef } from 'react';
import { Box, Text, useApp } from 'ink';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findConfig, loadConfig } from '../../config/index.js';
import type { CliFlags } from '../../types/index.js';

interface PreviewCommandProps {
  target: string;
  flags: CliFlags;
  /** Used in tests to bypass real filesystem/process logic */
  _testStep?: 'starting' | 'running' | 'error' | 'no-output';
  /** Override the resolved output dir (for tests) */
  _outputDir?: string;
}

type Status = 'starting' | 'running' | 'error' | 'no-output';

export function PreviewCommand({ target, flags, _testStep, _outputDir }: PreviewCommandProps) {
  const port = flags.port ?? 3000;
  const { exit } = useApp();

  // When a test step is provided, render that state directly without side-effects.
  const [status, setStatus] = useState<Status>(_testStep ?? 'starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvedOutputDir, setResolvedOutputDir] = useState(_outputDir ?? '');
  const [lines, setLines] = useState<string[]>([]);
  const childRef = useRef<ChildProcess | null>(null);

  useEffect(() => {
    // In test mode, skip all real IO.
    if (_testStep !== undefined) return;

    /**
     * Gracefully tear down the child process and exit Ink.
     * Sends SIGTERM first; if the child hasn't exited after 2 s, sends SIGKILL.
     */
    function teardown() {
      const child = childRef.current;
      if (child && !child.killed) {
        child.kill('SIGTERM');
        // Force-kill if it hasn't exited after 2 seconds
        const forceKillTimer = setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 2000);
        child.on('close', () => clearTimeout(forceKillTimer));
      }
      exit();
      process.exit(0);
    }

    function onSignal() {
      teardown();
    }

    // Register signal handlers for graceful shutdown
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);

    async function start() {
      // 1. Resolve target directory
      const targetDir = resolve(target || '.');

      // 2. Locate and load config (optional — config may not exist)
      let outputDir: string;
      try {
        const configPath = flags.config ? resolve(flags.config) : findConfig(targetDir);

        if (configPath) {
          const config = loadConfig(configPath);
          outputDir = resolve(join(targetDir, config.output));
        } else {
          outputDir = resolve(join(targetDir, './docs-output'));
        }
      } catch {
        // If config loading fails, fall back to default
        outputDir = resolve(join(targetDir, './docs-output'));
      }

      // Allow --output-dir / --output flag to override
      if (flags.output) {
        outputDir = resolve(flags.output);
      }

      setResolvedOutputDir(outputDir);

      // 3. Check output dir exists
      if (!existsSync(outputDir)) {
        setStatus('no-output');
        return;
      }

      // 4. Check package.json exists (confirms it's a generated Next.js site)
      const pkgJsonPath = join(outputDir, 'package.json');
      if (!existsSync(pkgJsonPath)) {
        setErrorMsg(
          `Output directory exists but does not contain a package.json.\n` +
            `Expected a generated Next.js site at: ${outputDir}\n` +
            `Run "wpdocs generate" to regenerate the documentation site.`
        );
        setStatus('error');
        return;
      }

      // 5. Spawn next dev server
      setStatus('running');

      const env = { ...process.env, PORT: String(port) };
      const child = spawn('npm', ['run', 'dev'], {
        cwd: outputDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      childRef.current = child;

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        const newLines = text.split('\n').filter((l) => l.trim().length > 0);
        setLines((prev) => [...prev, ...newLines].slice(-20));
      });

      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        const newLines = text.split('\n').filter((l) => l.trim().length > 0);
        setLines((prev) => [...prev, ...newLines].slice(-20));
      });

      child.on('error', (err) => {
        setErrorMsg(`Failed to start dev server: ${err.message}`);
        setStatus('error');
      });

      child.on('close', (code) => {
        if (code !== 0 && code !== null) {
          setErrorMsg(`Dev server exited with code ${code}`);
          setStatus('error');
        }
      });
    }

    start().catch((err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    });

    return () => {
      // Cleanup on unmount: kill child, remove signal listeners
      const child = childRef.current;
      if (child && !child.killed) {
        child.kill('SIGTERM');
      }
      process.removeListener('SIGINT', onSignal);
      process.removeListener('SIGTERM', onSignal);
    };
  }, []);

  if (status === 'no-output') {
    return (
      <Box flexDirection="column">
        <Text bold color="red">
          wpdocs preview — output not found
        </Text>
        <Text color="yellow">No generated documentation site found.</Text>
        <Text dimColor>
          Run <Text color="cyan">wpdocs generate</Text> first to build the docs site.
        </Text>
        {resolvedOutputDir ? <Text dimColor>Expected output at: {resolvedOutputDir}</Text> : null}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text bold color="red">
          wpdocs preview — error
        </Text>
        <Text color="red">{errorMsg}</Text>
      </Box>
    );
  }

  if (status === 'starting') {
    return (
      <Box flexDirection="column">
        <Text bold color="green">
          wpdocs preview
        </Text>
        <Text dimColor>Starting preview server…</Text>
      </Box>
    );
  }

  // status === 'running'
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        wpdocs preview
      </Text>
      <Text>
        Preview server running at{' '}
        <Text color="cyan" bold>
          http://localhost:{port}
        </Text>
      </Text>
      {flags.verbose && resolvedOutputDir ? (
        <Text dimColor>Serving: {resolvedOutputDir}</Text>
      ) : null}
      {lines.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {lines.map((line, i) => (
            <Text key={i} dimColor>
              {line}
            </Text>
          ))}
        </Box>
      )}
      <Text dimColor>Press Ctrl+C to stop</Text>
    </Box>
  );
}
