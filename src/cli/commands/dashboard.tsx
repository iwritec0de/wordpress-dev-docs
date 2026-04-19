import React from 'react';
import { Box, Text, Newline } from 'ink';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  /** Package version string (from package.json) */
  version?: string;
}

// ─── Command descriptions ────────────────────────────────────────────────────

const COMMANDS = [
  { name: 'generate', args: '[target]', desc: 'Parse source and build documentation site' },
  { name: 'init', args: '', desc: 'Create docs.config.json interactively' },
  { name: 'preview', args: '[target]', desc: 'Start local dev server to preview docs' },
  { name: 'validate', args: '[target]', desc: 'Check source for doc coverage / issues' },
  { name: 'mcp', args: '[target]', desc: 'Generate MCP reference only (no site)' },
] as const;

// ─── Main component ──────────────────────────────────────────────────────────

export function DashboardCommand({ version }: DashboardProps) {
  return (
    <Box flexDirection="column" paddingBottom={1}>
      {/* Title */}
      <Box>
        <Text bold color="cyan">
          wpdocs
        </Text>
        {version && <Text dimColor> v{version}</Text>}
      </Box>
      <Text dimColor>CLI documentation generator for WordPress plugins and themes</Text>

      <Newline />

      {/* Available commands */}
      <Text bold>Available commands:</Text>
      <Box flexDirection="column" paddingLeft={2} marginTop={1}>
        {COMMANDS.map((cmd) => (
          <Box key={cmd.name}>
            <Text color="cyan">{cmd.name.padEnd(12)}</Text>
            {cmd.args && <Text>{cmd.args.padEnd(12)}</Text>}
            {!cmd.args && <Text>{''.padEnd(12)}</Text>}
            <Text dimColor>{cmd.desc}</Text>
          </Box>
        ))}
      </Box>

      <Newline />

      {/* Quick start */}
      <Text bold>Quick start:</Text>
      <Box flexDirection="column" paddingLeft={2} marginTop={1}>
        <Text>
          <Text dimColor>$ </Text>
          <Text color="green">wpdocs generate ./my-plugin</Text>
        </Text>
        <Text>
          <Text dimColor>$ </Text>
          <Text color="green">wpdocs init</Text>
        </Text>
        <Text>
          <Text dimColor>$ </Text>
          <Text color="green">wpdocs --help</Text>
        </Text>
      </Box>
    </Box>
  );
}
