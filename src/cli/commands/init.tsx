import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PluginType = 'plugin' | 'theme' | 'collection';

export interface Answers {
  name: string;
  type: PluginType;
  source: string;
  output: string;
  mcp: boolean;
}

export type InitStep = 'name' | 'type' | 'source' | 'output' | 'mcp' | 'done' | 'exists' | 'error';

export interface ConfigFile {
  name: string;
  type: PluginType;
  source: string;
  exclude: string[];
  output: string;
  theme: string;
  site: { title: string; description: string };
  mcp: { enabled: boolean; output: string };
}

// ─── Pure logic ───────────────────────────────────────────────────────────────

/**
 * Build the docs.config.json content from collected answers.
 * Pure function — no side effects.
 */
export function buildConfig(a: Answers): ConfigFile {
  return {
    name: a.name,
    type: a.type,
    source: a.source,
    exclude: ['vendor/**', 'node_modules/**'],
    output: a.output,
    theme: 'default',
    site: {
      title: `${a.name} Docs`,
      description: `Developer documentation for ${a.name}`,
    },
    mcp: {
      enabled: a.mcp,
      output: './mcp-reference',
    },
  };
}

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
}

function TextInput({ placeholder = '', onSubmit }: TextInputProps) {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      return;
    }
    if (!key.ctrl && !key.meta && input) {
      setValue((v) => v + input);
    }
  });

  const display = value || placeholder;
  const color = value ? 'white' : 'gray';

  return (
    <Text color={color}>
      {display}
      <Text inverse> </Text>
    </Text>
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectInputProps<T extends string> {
  options: SelectOption<T>[];
  onSubmit: (value: T) => void;
}

function SelectInput<T extends string>({ options, onSubmit }: SelectInputProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
    } else if (key.return) {
      onSubmit(options[selectedIndex]!.value);
    }
  });

  return (
    <Box flexDirection="column">
      {options.map((opt, i) => (
        <Text key={opt.value} color={i === selectedIndex ? 'cyan' : undefined}>
          {i === selectedIndex ? '› ' : '  '}
          {opt.label}
        </Text>
      ))}
    </Box>
  );
}

// ─── Options ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: SelectOption<PluginType>[] = [
  { label: 'Plugin', value: 'plugin' },
  { label: 'Theme', value: 'theme' },
  { label: 'Plugin Collection', value: 'collection' },
];

type YesNo = 'yes' | 'no';

const YES_NO_OPTIONS: SelectOption<YesNo>[] = [
  { label: 'No', value: 'no' },
  { label: 'Yes', value: 'yes' },
];

// ─── InitCommand ─────────────────────────────────────────────────────────────

interface InitCommandProps {
  cwd?: string;
  /** @internal for testing only — start at a specific step */
  _testStep?: InitStep;
  /** @internal for testing only — pre-populate answers */
  _testAnswers?: Partial<Answers>;
}

export function InitCommand({ cwd = process.cwd(), _testStep, _testAnswers }: InitCommandProps) {
  const configPath = join(cwd, 'docs.config.json');
  const alreadyExists = existsSync(configPath);

  const initialStep = _testStep ?? (alreadyExists ? 'exists' : 'name');
  const [step, setStep] = useState<InitStep>(initialStep);
  const [answers, setAnswers] = useState<Partial<Answers>>(_testAnswers ?? {});
  const [errorMsg, setErrorMsg] = useState('');

  function handleName(value: string) {
    const name = value.trim();
    if (!name) return;
    setAnswers((a) => ({ ...a, name }));
    setStep('type');
  }

  function handleType(value: PluginType) {
    setAnswers((a) => ({ ...a, type: value }));
    setStep('source');
  }

  function handleSource(value: string) {
    setAnswers((a) => ({ ...a, source: value.trim() || './' }));
    setStep('output');
  }

  function handleOutput(value: string) {
    setAnswers((a) => ({ ...a, output: value.trim() || './docs-output' }));
    setStep('mcp');
  }

  function handleMcp(value: YesNo) {
    const final: Answers = {
      name: answers.name!,
      type: answers.type ?? 'plugin',
      source: answers.source ?? './',
      output: answers.output ?? './docs-output',
      mcp: value === 'yes',
    };
    const config = buildConfig(final);
    try {
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
      setAnswers(final);
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'exists') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">
          docs.config.json already exists
        </Text>
        <Text>
          <Text color="cyan">{configPath}</Text>
        </Text>
        <Text dimColor>Run "wpdocs init" in a directory without an existing config.</Text>
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">
          Failed to write docs.config.json
        </Text>
        <Text>{errorMsg || 'Unknown error'}</Text>
      </Box>
    );
  }

  if (step === 'done') {
    const a = answers as Answers;
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="green">
          Created docs.config.json
        </Text>
        <Text color="cyan">{configPath}</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Configuration summary:</Text>
          <Text>
            {'  '}Name:{' '}
            <Text color="white" bold>
              {a.name}
            </Text>
          </Text>
          <Text>
            {'  '}Type: <Text color="white">{a.type}</Text>
          </Text>
          <Text>
            {'  '}Source: <Text color="white">{a.source}</Text>
          </Text>
          <Text>
            {'  '}Output: <Text color="white">{a.output}</Text>
          </Text>
          <Text>
            {'  '}MCP:{' '}
            <Text color={a.mcp ? 'green' : 'gray'}>{a.mcp ? 'enabled' : 'disabled'}</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            Next: run <Text color="cyan">wpdocs generate</Text> to build your documentation.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">
        wpdocs init
      </Text>
      <Text dimColor>Create a docs.config.json for your WordPress plugin or theme.</Text>

      {/* Completed answers */}
      {answers.name && step !== 'name' && (
        <Text>
          <Text color="green">✓</Text> Name: <Text color="white">{answers.name}</Text>
        </Text>
      )}
      {answers.type && step !== 'name' && step !== 'type' && (
        <Text>
          <Text color="green">✓</Text> Type: <Text color="white">{answers.type}</Text>
        </Text>
      )}
      {answers.source && step !== 'name' && step !== 'type' && step !== 'source' && (
        <Text>
          <Text color="green">✓</Text> Source: <Text color="white">{answers.source}</Text>
        </Text>
      )}
      {answers.output && step === 'mcp' && (
        <Text>
          <Text color="green">✓</Text> Output: <Text color="white">{answers.output}</Text>
        </Text>
      )}

      {/* Current prompt */}
      {step === 'name' && (
        <Box flexDirection="column">
          <Text>
            Plugin / theme name: <Text dimColor>(required)</Text>
          </Text>
          <TextInput onSubmit={handleName} />
        </Box>
      )}

      {step === 'type' && (
        <Box flexDirection="column">
          <Text>
            Type: <Text dimColor>(↑↓ to select, Enter to confirm)</Text>
          </Text>
          <SelectInput options={TYPE_OPTIONS} onSubmit={handleType} />
        </Box>
      )}

      {step === 'source' && (
        <Box flexDirection="column">
          <Text>
            Source directory: <Text dimColor>(default: ./)</Text>
          </Text>
          <TextInput placeholder="./" onSubmit={handleSource} />
        </Box>
      )}

      {step === 'output' && (
        <Box flexDirection="column">
          <Text>
            Output directory: <Text dimColor>(default: ./docs-output)</Text>
          </Text>
          <TextInput placeholder="./docs-output" onSubmit={handleOutput} />
        </Box>
      )}

      {step === 'mcp' && (
        <Box flexDirection="column">
          <Text>
            Generate MCP reference? <Text dimColor>(AI-queryable API reference, ↑↓ to select)</Text>
          </Text>
          <SelectInput options={YES_NO_OPTIONS} onSubmit={handleMcp} />
        </Box>
      )}
    </Box>
  );
}
