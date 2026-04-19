import React from 'react';
import { Box, Text } from 'ink';
import { formatFileLine } from '../lib/format-error.js';

interface ErrorMessageProps {
  message: string;
  file?: string;
  line?: number;
  col?: number;
}

export function ErrorMessage({ message, file, line, col }: ErrorMessageProps) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color="red" bold>
          Error:{' '}
        </Text>
        <Text>{message}</Text>
      </Box>
      {file && (
        <Box>
          <Text dimColor>{'  at '}</Text>
          <Text>{formatFileLine(file, line, col)}</Text>
        </Box>
      )}
    </Box>
  );
}
