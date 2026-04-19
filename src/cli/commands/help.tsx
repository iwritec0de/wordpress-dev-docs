import React from 'react';
import { Box, Text, Newline } from 'ink';

export function HelpCommand() {
  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Text bold>wpdocs</Text>
      <Text dimColor>CLI documentation generator for WordPress plugins and themes</Text>
      <Newline />
      <Text bold>Usage:</Text>
      <Text>{'  wpdocs <command> [target] [flags]'}</Text>
      <Newline />
      <Text bold>Commands:</Text>
      <Box flexDirection="column" paddingLeft={2}>
        <Text>
          <Text color="cyan">generate</Text>
          {'  [target]   Parse source and build documentation site'}
        </Text>
        <Text>
          <Text color="cyan">init</Text>
          {'             Create docs.config.json interactively'}
        </Text>
        <Text>
          <Text color="cyan">preview</Text>
          {'          Start local dev server to preview generated docs'}
        </Text>
        <Text>
          <Text color="cyan">mcp</Text>
          {'      [target]   Generate MCP reference only (no site)'}
        </Text>
        <Text>
          <Text color="cyan">themes</Text>
          {'           List available built-in themes'}
        </Text>
        <Text>
          <Text color="cyan">validate</Text>
          {'  [target]   Check source for doc coverage / issues'}
        </Text>
      </Box>
      <Newline />
      <Text bold>Flags:</Text>
      <Box flexDirection="column" paddingLeft={2}>
        <Text>
          <Text color="cyan">--config, -c</Text>
          {'    Path to docs.config.json'}
        </Text>
        <Text>
          <Text color="cyan">--output-dir</Text>
          {'    Override output directory'}
        </Text>
        <Text>
          <Text color="cyan">--output, -o</Text>
          {'    Alias for --output-dir (deprecated)'}
        </Text>
        <Text>
          <Text color="cyan">--guides</Text>
          {'        Path to a folder of MDX guide content'}
        </Text>
        <Text>
          <Text color="cyan">--skin</Text>
          {'          Built-in skin name or path to skin JSON'}
        </Text>
        <Text>
          <Text color="cyan">--tokens</Text>
          {'        Path to token overrides JSON (layered on skin)'}
        </Text>
        <Text>
          <Text color="cyan">--theme, -t</Text>
          {'     Override theme selection (legacy)'}
        </Text>
        <Text>
          <Text color="cyan">--type</Text>
          {'          plugin | theme | collection'}
        </Text>
        <Text>
          <Text color="cyan">--port, -p</Text>
          {'      Port for preview/mcp server (default: 3000)'}
        </Text>
        <Text>
          <Text color="cyan">--verbose, -v</Text>
          {'   Detailed output during generation'}
        </Text>
        <Text>
          <Text color="cyan">--dry-run</Text>
          {'       Parse and report without writing output'}
        </Text>
      </Box>
      <Newline />
      <Text bold>Examples:</Text>
      <Box flexDirection="column" paddingLeft={2}>
        <Text dimColor>$ wpdocs generate ./my-plugin</Text>
        <Text dimColor>$ wpdocs generate ./my-plugin --output-dir ./docs</Text>
        <Text dimColor>$ wpdocs generate ./my-plugin --skin wordpress</Text>
        <Text dimColor>$ wpdocs generate ./plugins/ --type collection</Text>
        <Text dimColor>$ wpdocs validate ./my-plugin</Text>
        <Text dimColor>$ wpdocs validate ./my-plugin --verbose</Text>
        <Text dimColor>$ wpdocs preview --port 4000</Text>
        <Text dimColor>$ wpdocs mcp ./my-plugin</Text>
        <Text dimColor>$ wpdocs init</Text>
      </Box>
    </Box>
  );
}
