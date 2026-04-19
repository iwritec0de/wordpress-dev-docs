import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { resolve, basename } from 'path';
import { parseTarget } from '../../parser/index.js';
import { validateDocs } from '../../validator/index.js';
import { loadConfig, findConfig, resolveConfig } from '../../config/loader.js';
import type { DocsConfig } from '../../config/schema.js';
import { VALIDATION_FAILURE } from '../lib/exit-codes.js';
import type { ValidationResult, ValidationIssue } from '../../validator/index.js';
import type { CliFlags } from '../../types/index.js';
import { formatFileLine } from '../lib/format-error.js';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ValidateCommandProps {
  target: string;
  flags: CliFlags;
  /** Inject a pre-computed result (for tests) */
  _testResult?: ValidationResult;
  /** Force a specific display step (for tests) */
  _testStep?: 'loading' | 'done' | 'error';
}

// ─── Coverage bar ─────────────────────────────────────────────────────────────

const BAR_WIDTH = 20;

function CoverageBar({ coverage }: { coverage: number }) {
  const filled = Math.round((coverage / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  const color = coverage >= 80 ? 'green' : coverage >= 50 ? 'yellow' : 'red';

  return (
    <Text>
      <Text color={color}>{bar}</Text>
      <Text bold color={color}>
        {' '}
        {coverage}%
      </Text>
    </Text>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const color = issue.severity === 'error' ? 'red' : 'yellow';
  const prefix = issue.severity === 'error' ? 'ERR' : 'WRN';

  return (
    <Box marginLeft={2}>
      <Text color={color}>[{prefix}] </Text>
      <Text color="cyan">{issue.symbol}</Text>
      <Text dimColor> ({issue.type}): </Text>
      <Text>{issue.message}</Text>
      <Text dimColor> — {formatFileLine(issue.file, issue.line)}</Text>
    </Box>
  );
}

function IssueGroup({ file, issues }: { file: string; issues: ValidationIssue[] }) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text bold underline>
          {file}
        </Text>
        <Text dimColor>
          {' '}
          ({errors.length}E / {warnings.length}W)
        </Text>
      </Box>
      {issues.map((issue, i) => (
        <IssueRow key={i} issue={issue} />
      ))}
    </Box>
  );
}

function ResultView({ result }: { result: ValidationResult }) {
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  // Apply exit code for validation failures
  if (errors.length > 0) {
    process.exitCode = VALIDATION_FAILURE;
  }

  // Group issues by file
  const byFile = new Map<string, ValidationIssue[]>();
  for (const issue of result.issues) {
    const list = byFile.get(issue.file) ?? [];
    list.push(issue);
    byFile.set(issue.file, list);
  }

  const fileCount = byFile.size;

  return (
    <Box flexDirection="column">
      {/* Coverage bar */}
      <Box marginTop={1}>
        <Text>Coverage: </Text>
        <CoverageBar coverage={result.stats.coverage} />
        <Text dimColor>
          {' '}
          ({result.stats.documented}/{result.stats.total} symbols)
        </Text>
      </Box>

      {/* Summary line */}
      <Box marginTop={1}>
        {result.issues.length === 0 ? (
          <Text color="green" bold>
            All checks passed
          </Text>
        ) : (
          <Text>
            <Text bold color="red">
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </Text>
            <Text>, </Text>
            <Text bold color="yellow">
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </Text>
            <Text dimColor>
              {' '}
              in {fileCount} file{fileCount !== 1 ? 's' : ''}
            </Text>
          </Text>
        )}
      </Box>

      {/* Issues grouped by file */}
      {[...byFile.entries()].map(([file, issues]) => (
        <IssueGroup key={file} file={file} issues={issues} />
      ))}
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ValidateCommand({ target, flags, _testResult, _testStep }: ValidateCommandProps) {
  const [step, setStep] = useState<'loading' | 'done' | 'error'>(_testStep ?? 'loading');
  const [result, setResult] = useState<ValidationResult | undefined>(_testResult);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // If test props are provided, skip the actual parse
    if (_testResult !== undefined || _testStep !== undefined) return;

    async function run() {
      try {
        const absTarget = resolve(target);

        // Load config: explicit path > auto-discover > synthesise from target
        let config: DocsConfig;
        if (flags.config) {
          const configPath = resolve(flags.config);
          config = loadConfig(configPath);
        } else {
          const found = findConfig(absTarget);
          if (found) {
            config = loadConfig(found);
          } else {
            config = resolveConfig({
              name: basename(absTarget),
              source: absTarget,
            });
          }
        }

        // Apply CLI flag overrides
        const overrides: Partial<DocsConfig> = {};
        if (flags.type) overrides.type = flags.type;
        if (flags.exclude) overrides.exclude = flags.exclude;

        if (Object.keys(overrides).length > 0) {
          config = resolveConfig({ ...config, ...overrides });
        }

        // Ensure source points at the target directory
        config = { ...config, source: absTarget };

        const parsed = await parseTarget(config);
        const validated = validateDocs(parsed);
        setResult(validated);
        setStep('done');
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : String(e));
        setStep('error');
      }
    }

    void run();
  }, []);

  return (
    <Box flexDirection="column">
      <Text bold color="green">
        wpdocs validate
      </Text>
      <Text>
        Target: <Text color="cyan">{target}</Text>
      </Text>
      {flags.verbose && <Text dimColor>Verbose mode enabled</Text>}

      {step === 'loading' && <Text dimColor>Scanning documentation coverage...</Text>}
      {step === 'error' && <Text color="red">Error: {errorMessage}</Text>}
      {step === 'done' && result && <ResultView result={result} />}
    </Box>
  );
}
