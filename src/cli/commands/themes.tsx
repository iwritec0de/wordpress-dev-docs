import React from 'react';
import { Box, Text, Newline } from 'ink';
import { BUILT_IN_SKINS, loadBuiltInSkin, type Skin } from '../../generator/site/tokens.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkinSummary {
  id: string;
  name: string;
  hasDark: boolean;
  accentColor: string;
}

// ─── Data loading ─────────────────────────────────────────────────────────────

/**
 * Load all built-in skins and produce a summary tuple for display / JSON output.
 *
 * Errors loading a single skin are surfaced as a synthetic entry rather than
 * aborting the whole listing — `wpdocs themes` should never crash because of
 * one corrupt skin file.
 */
export function loadSkinSummaries(): SkinSummary[] {
  return BUILT_IN_SKINS.map((id): SkinSummary => {
    try {
      const skin: Skin = loadBuiltInSkin(id);
      return {
        id,
        name: skin.name,
        hasDark: Boolean(skin.dark),
        accentColor: skin.tokens.color.accent,
      };
    } catch (err) {
      return {
        id,
        name: `(error: ${err instanceof Error ? err.message : 'unknown'})`,
        hasDark: false,
        accentColor: '',
      };
    }
  });
}

// ─── Ink command ──────────────────────────────────────────────────────────────

export function ThemesCommand() {
  const skins = loadSkinSummaries();
  const longest = skins.reduce((max, s) => Math.max(max, s.id.length), 0);

  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Box>
        <Text bold color="cyan">
          wpdocs themes
        </Text>
      </Box>
      <Text dimColor>{skins.length} built-in skins available</Text>

      <Newline />

      <Box flexDirection="column">
        {skins.map((skin) => (
          <Box key={skin.id}>
            <Box width={longest + 2}>
              <Text color="cyan">{skin.id}</Text>
            </Box>
            <Text>{skin.name}</Text>
            {skin.hasDark && <Text dimColor> · dark variant</Text>}
          </Box>
        ))}
      </Box>

      <Newline />

      <Text dimColor>Use with: wpdocs generate ./my-plugin --skin &lt;id&gt;</Text>
    </Box>
  );
}
