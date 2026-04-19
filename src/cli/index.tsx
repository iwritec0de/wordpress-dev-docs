import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { resolve } from 'path';
import { App } from './App.js';
import { runJsonGenerate, runJsonValidate } from './lib/json-runners.js';
import { loadSkinSummaries } from './commands/themes.js';
import { checkForUpdate } from './lib/update-check.js';
import type { CliFlags, Command } from '../types/index.js';

const cli = meow(
  `
  Usage
    $ wpdocs <command> [target] [flags]

  Commands
    generate [target]   Parse source and build documentation site
    init                Create docs.config.json interactively
    preview             Start local dev server to preview generated docs
    mcp [target]        Generate MCP reference only (no site)
    themes              List available built-in themes
    validate [target]   Check source for doc coverage / issues

  Flags
    --config, -c    Path to docs.config.json
    --output-dir    Override output directory
    --output, -o    Alias for --output-dir
    --guides        Path to a folder of MDX guide content
    --theme, -t     Override theme selection (legacy)
    --skin          Built-in skin name or path to skin JSON
    --tokens        Path to token overrides JSON (layered on skin)
    --exclude       Glob patterns to exclude (repeatable)
    --type          plugin | theme | collection
    --port, -p      Port for preview server (default: 3000)
    --json          Machine-readable JSON output (for CI / tooling)
    --verbose, -v   Detailed output during generation
    --dry-run       Parse and report without writing output
    --version       Show version number
    --help          Show this help

  Examples
    $ wpdocs generate ./my-plugin
    $ wpdocs generate ./my-plugin --output-dir ./docs
    $ wpdocs generate ./my-plugin --skin wordpress
    $ wpdocs generate ./plugins/ --type collection
    $ wpdocs validate ./my-plugin
    $ wpdocs validate ./my-plugin --verbose
    $ wpdocs preview
    $ wpdocs preview --port 4000
    $ wpdocs mcp ./my-plugin
    $ wpdocs init
`,
  {
    importMeta: import.meta,
    flags: {
      config: { type: 'string', shortFlag: 'c' },
      outputDir: { type: 'string' },
      output: { type: 'string', shortFlag: 'o' },
      guides: { type: 'string' },
      theme: { type: 'string', shortFlag: 't' },
      skin: { type: 'string' },
      tokens: { type: 'string' },
      type: { type: 'string' },
      json: { type: 'boolean', default: false },
      verbose: { type: 'boolean', shortFlag: 'v', default: false },
      dryRun: { type: 'boolean', default: false },
      port: { type: 'number', shortFlag: 'p' },
      exclude: { type: 'string', isMultiple: true },
    },
  }
);

const VALID_COMMANDS: Command[] = ['generate', 'init', 'preview', 'mcp', 'themes', 'validate'];

const rawCommand = cli.input[0];
const hasCommand = VALID_COMMANDS.includes(rawCommand as Command);
const command: Command = hasCommand
  ? (rawCommand as Command)
  : rawCommand
    ? 'generate'
    : 'dashboard';

const target = cli.input[1] ?? cli.input[0];

if (cli.flags.output && !cli.flags.outputDir) {
  process.stderr.write('Warning: --output / -o is deprecated. Use --output-dir instead.\n');
}

const flags: CliFlags = {
  config: cli.flags.config,
  output: cli.flags.outputDir ?? cli.flags.output,
  guides: cli.flags.guides,
  theme: cli.flags.theme,
  skin: cli.flags.skin,
  tokens: cli.flags.tokens,
  type: cli.flags.type as CliFlags['type'],
  json: cli.flags.json,
  verbose: cli.flags.verbose,
  dryRun: cli.flags.dryRun,
  port: cli.flags.port,
  exclude: cli.flags.exclude?.length ? cli.flags.exclude : undefined,
  _version:
    typeof cli.pkg === 'object' && cli.pkg !== null && 'version' in cli.pkg
      ? String((cli.pkg as Record<string, unknown>).version)
      : undefined,
};

// ─── JSON mode: bypass Ink and output machine-readable JSON ──────────────────

if (flags.json) {
  const targetDir = resolve(target || '.');

  if (command === 'generate') {
    runJsonGenerate(targetDir, flags);
  } else if (command === 'validate') {
    runJsonValidate(targetDir, flags);
  } else if (command === 'themes') {
    console.log(JSON.stringify({ themes: loadSkinSummaries() }));
  } else {
    process.stderr.write(`Error: --json is not supported for the "${command}" command.\n`);
    process.exitCode = 1;
  }
} else {
  render(<App input={{ command, target, flags }} />);
}

// Fire-and-forget update check — never blocks CLI execution
checkForUpdate('0.1.0').then((msg) => {
  if (msg) {
    process.stderr.write(`\n${msg}\n`);
  }
});
