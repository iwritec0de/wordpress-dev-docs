# Changelog

All notable changes to `@iwritec0de/wpdocs` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.0] — 2026-04-17

Initial stable release.

### Parsers

- PHP: functions, classes (methods, properties, constants, visibility), constants, file headers, PHPDoc (`@param`, `@return`, `@since`, `@deprecated`).
- WordPress: `add_action` / `add_filter` / `do_action` / `apply_filters` hook detection, `register_rest_route` and `register_rest_field`, `readme.txt`, plugin/theme headers, `block.json`, `CHANGELOG.md`.
- JavaScript: JSDoc extraction via Babel, `wp.hooks` / `wp.data` detection.
- CSS: file-level doc blocks, custom properties (design tokens) via PostCSS.
- Collection mode: multiple plugins parsed into a unified reference.

### Generators

- Static Next.js 16 site with sidebar nav, FlexSearch command-palette search, dark mode, MDX guides.
- 8 built-in skins: default, dark-pro, midnight, sandstone, sunset, syntax, terminal, wordpress.
- Custom skin JSON and token override support.
- Reference overrides via `overrides.yaml` or `overrides.json` — user-supplied tips and code examples merged onto parsed items.
- MCP reference generator (JSON) and standalone MCP HTTP server with 11 routes.

### CLI

- Commands: `generate`, `init`, `validate`, `preview`, `mcp`, `themes`, `build`.
- `--json` output mode for CI integration.
- `--dry-run` flag.
- Ink-based interactive UI.

### Infrastructure

- Node 20 and 22 tested in CI.
- 743 tests across 41 files.
- TypeScript, ESLint, Prettier, tsup build.

[Unreleased]: https://github.com/iwritec0de/wordpress-dev-docs/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/iwritec0de/wordpress-dev-docs/releases/tag/v1.0.0
