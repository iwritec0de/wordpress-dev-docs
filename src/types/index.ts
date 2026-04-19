export type Command = 'generate' | 'init' | 'preview' | 'mcp' | 'themes' | 'validate' | 'dashboard';

export interface CliFlags {
  config?: string;
  output?: string;
  guides?: string;
  theme?: string;
  skin?: string;
  tokens?: string;
  type?: 'plugin' | 'theme' | 'collection';
  exclude?: string[];
  verbose?: boolean;
  dryRun?: boolean;
  port?: number;
  json?: boolean;
  /** Internal: package version passed to dashboard */
  _version?: string;
}

export interface CliInput {
  command: Command;
  target?: string;
  flags: CliFlags;
}
