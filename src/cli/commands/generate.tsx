import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { resolve } from 'path';
import type { CliFlags } from '../../types/index.js';
import {
  runGenerate,
  type GenerateProgress,
  type GeneratePipelineResult,
} from '../../generator/index.js';
import { ErrorMessage } from '../components/ErrorMessage.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'running' | 'done' | 'error';

interface State {
  phase: Phase;
  currentStage: GenerateProgress['stage'] | null;
  stageMessage: string;
  completedStages: GenerateProgress['stage'][];
  result: GeneratePipelineResult | null;
  error: string | null;
}

// ─── Stage labels ─────────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<GenerateProgress['stage'], string> = {
  config: 'Load config',
  parse: 'Parse source',
  mcp: 'Build reference',
  scaffold: 'Scaffold site',
  done: 'Complete',
};

export const STAGE_ORDER: GenerateProgress['stage'][] = [
  'config',
  'parse',
  'mcp',
  'scaffold',
  'done',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

export function StageRow({
  label,
  status,
  message,
}: {
  label: string;
  status: 'pending' | 'running' | 'done';
  message?: string;
}) {
  if (status === 'done') {
    return (
      <Box>
        <Text color="green">✓ </Text>
        <Text>{label}</Text>
      </Box>
    );
  }
  if (status === 'running') {
    return (
      <Box>
        <Text color="yellow">› </Text>
        <Text bold>{label}</Text>
        {message && <Text dimColor> — {message}</Text>}
      </Box>
    );
  }
  return (
    <Box>
      <Text dimColor> {label}</Text>
    </Box>
  );
}

export function ResultSummary({ result }: { result: GeneratePipelineResult }) {
  const { parseResult, reference, scaffoldResult, mcpOutputPath, dryRun, warnings } = result;

  const phpCount = parseResult.php.reduce((n, r) => n + r.functions.length + r.classes.length, 0);
  const hookCount = parseResult.hooks.reduce((n, r) => n + r.hooks.length, 0);
  const jsCount = parseResult.js.reduce((n, r) => n + r.functions.length + r.classes.length, 0);
  const cssCount = parseResult.css.reduce((n, r) => n + r.customProperties.length, 0);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="green">
        {dryRun ? 'Dry run complete — no files written' : 'Documentation generated!'}
      </Text>

      <Box flexDirection="column" marginTop={1} marginLeft={2}>
        <Text dimColor>Source: </Text>
        <Text> {parseResult.sourceRoot}</Text>
        {!dryRun && scaffoldResult && (
          <>
            <Text dimColor>Output: </Text>
            <Text> {scaffoldResult.outputDir}</Text>
          </>
        )}
        {mcpOutputPath && (
          <>
            <Text dimColor>MCP reference: </Text>
            <Text> {mcpOutputPath}</Text>
          </>
        )}
      </Box>

      <Box flexDirection="column" marginTop={1} marginLeft={2}>
        <Text>
          PHP: {phpCount} items · Hooks: {hookCount} · JS: {jsCount} items · CSS tokens: {cssCount}
        </Text>
        <Text>
          Functions: {reference.functions.length} · Classes: {reference.classes.length} · Constants:{' '}
          {reference.constants.length}
        </Text>
        {!dryRun && scaffoldResult && <Text>Site files: {scaffoldResult.filesWritten.length}</Text>}
      </Box>

      {warnings.length > 0 && (
        <Box flexDirection="column" marginTop={1} marginLeft={2}>
          <Text color="yellow">Warnings ({warnings.length}):</Text>
          {warnings.slice(0, 5).map((w, i) => (
            <Text key={i} dimColor>
              {w}
            </Text>
          ))}
          {warnings.length > 5 && <Text dimColor>… and {warnings.length - 5} more</Text>}
        </Box>
      )}

      {!dryRun && scaffoldResult && (
        <Box marginTop={1} marginLeft={2}>
          <Text dimColor>
            Preview:{' '}
            <Text color="cyan">cd {scaffoldResult.outputDir} && npm install && npm run dev</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GenerateCommandProps {
  target: string;
  flags: CliFlags;
}

export function GenerateCommand({ target, flags }: GenerateCommandProps) {
  const { exit } = useApp();

  const [state, setState] = useState<State>({
    phase: 'running',
    currentStage: null,
    stageMessage: '',
    completedStages: [],
    result: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const targetDir = resolve(target || '.');

    runGenerate({ targetDir, flags }, (progress) => {
      if (cancelled) return;
      setState((prev) => {
        // When moving to a new stage, mark the previous stage as completed
        const prevStage = prev.currentStage;
        const nowDone =
          prevStage !== null && prevStage !== progress.stage && prevStage !== 'done'
            ? [...prev.completedStages, prevStage]
            : prev.completedStages;
        return {
          ...prev,
          currentStage: progress.stage,
          stageMessage: progress.message,
          completedStages: nowDone,
        };
      });
    })
      .then((result) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          phase: 'done',
          currentStage: 'done',
          completedStages: STAGE_ORDER.filter((s) => s !== 'done'),
          result,
        }));
        setImmediate(() => exit());
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({ ...prev, phase: 'error', error: message }));
        process.exitCode = 1;
        setImmediate(() => exit());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === 'error') {
    return <ErrorMessage message={state.error ?? 'Unknown error'} />;
  }

  const displayStages = STAGE_ORDER.filter((s) => s !== 'done');

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>wpdocs generate </Text>
        <Text color="cyan">{target || '.'}</Text>
        {flags.dryRun && <Text color="yellow"> --dry-run</Text>}
      </Box>

      {displayStages.map((stage) => {
        const isDone = state.completedStages.includes(stage);
        const isRunning = state.currentStage === stage && state.phase === 'running';
        return (
          <StageRow
            key={stage}
            label={STAGE_LABELS[stage]}
            status={isDone ? 'done' : isRunning ? 'running' : 'pending'}
            message={isRunning ? state.stageMessage : undefined}
          />
        );
      })}

      {state.phase === 'done' && state.result && <ResultSummary result={state.result} />}
    </Box>
  );
}
