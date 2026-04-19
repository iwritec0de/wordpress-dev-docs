import React from 'react';
import { GenerateCommand } from './commands/generate.js';
import { InitCommand } from './commands/init.js';
import { PreviewCommand } from './commands/preview.js';
import { HelpCommand } from './commands/help.js';
import { ValidateCommand } from './commands/validate.js';
import { McpCommand } from './commands/mcp.js';
import { DashboardCommand } from './commands/dashboard.js';
import { ThemesCommand } from './commands/themes.js';
import type { CliInput } from '../types/index.js';

interface AppProps {
  input: CliInput;
}

export function App({ input }: AppProps) {
  const { command, target, flags } = input;

  switch (command) {
    case 'generate':
      return <GenerateCommand target={target ?? '.'} flags={flags} />;
    case 'init':
      return <InitCommand cwd={target ?? process.cwd()} />;
    case 'validate':
      return <ValidateCommand target={target ?? '.'} flags={flags} />;
    case 'mcp':
      return <McpCommand target={target ?? '.'} flags={flags} />;
    case 'preview':
      return <PreviewCommand target={target ?? '.'} flags={flags} />;
    case 'dashboard':
      return <DashboardCommand version={flags._version} />;
    case 'themes':
      return <ThemesCommand />;
    default:
      return <HelpCommand />;
  }
}
