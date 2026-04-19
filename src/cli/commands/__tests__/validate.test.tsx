import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { ValidateCommand } from '../validate.js';
import type { ValidationResult } from '../../../validator/index.js';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeCleanResult(): ValidationResult {
  return {
    issues: [],
    stats: { total: 10, documented: 10, coverage: 100 },
  };
}

function makeResultWithIssues(): ValidationResult {
  return {
    issues: [
      {
        type: 'missing-doc',
        severity: 'error',
        message: 'Function "my_fn" is missing a PHPDoc block',
        file: '/tmp/plugin/src/functions.php',
        line: 42,
        symbol: 'my_fn',
      },
      {
        type: 'missing-return',
        severity: 'warning',
        message: 'Function "other_fn" is missing a @return tag',
        file: '/tmp/plugin/src/functions.php',
        line: 60,
        symbol: 'other_fn',
      },
      {
        type: 'missing-doc',
        severity: 'warning',
        message: 'JS function "jsHelper" is missing a JSDoc block',
        file: '/tmp/plugin/assets/js/main.js',
        line: 5,
        symbol: 'jsHelper',
      },
    ],
    stats: { total: 10, documented: 7, coverage: 70 },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ValidateCommand', () => {
  it('shows the "wpdocs validate" heading', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeCleanResult()}
        _testStep="done"
      />
    );
    expect(lastFrame()).toContain('wpdocs validate');
  });

  it('shows the target path', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/my-plugin"
        flags={{}}
        _testResult={makeCleanResult()}
        _testStep="done"
      />
    );
    expect(lastFrame()).toContain('/tmp/my-plugin');
  });

  it('shows error and warning summary when issues are found', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeResultWithIssues()}
        _testStep="done"
      />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('1 error');
    expect(frame).toContain('2 warnings');
    expect(frame).toContain('in 2 files');
  });

  it('shows per-file error/warning counts in group headers', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeResultWithIssues()}
        _testStep="done"
      />
    );
    const frame = lastFrame() ?? '';
    // functions.php has 1 error + 1 warning
    expect(frame).toContain('(1E / 1W)');
    // main.js has 0 errors + 1 warning
    expect(frame).toContain('(0E / 1W)');
  });

  it('shows documentation coverage percentage', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeResultWithIssues()}
        _testStep="done"
      />
    );
    expect(lastFrame()).toContain('70%');
  });

  it('shows "All checks passed" for a clean result', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeCleanResult()}
        _testStep="done"
      />
    );
    expect(lastFrame()).toContain('All checks passed');
  });

  it('shows file paths for issues', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeResultWithIssues()}
        _testStep="done"
      />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('/tmp/plugin/src/functions.php');
    expect(frame).toContain('/tmp/plugin/assets/js/main.js');
  });

  it('shows a loading message while scanning', () => {
    const { lastFrame } = render(
      <ValidateCommand target="/tmp/plugin" flags={{}} _testStep="loading" />
    );
    expect(lastFrame()).toContain('Scanning');
  });

  it('shows an error message on failure', () => {
    const { lastFrame } = render(
      <ValidateCommand target="/tmp/plugin" flags={{}} _testStep="error" _testResult={undefined} />
    );
    // error step with no message — just check "Error:" prefix is shown
    expect(lastFrame()).toContain('Error:');
  });

  it('shows 100% coverage for a clean result', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeCleanResult()}
        _testStep="done"
      />
    );
    expect(lastFrame()).toContain('100%');
  });

  it('shows coverage bar with symbol counts', () => {
    const { lastFrame } = render(
      <ValidateCommand
        target="/tmp/plugin"
        flags={{}}
        _testResult={makeResultWithIssues()}
        _testStep="done"
      />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Coverage:');
    expect(frame).toContain('7/10 symbols');
  });
});
