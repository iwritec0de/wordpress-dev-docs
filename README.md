# wpdocs

[![CI](https://github.com/iwritec0de/wordpress-dev-docs/actions/workflows/ci.yml/badge.svg)](https://github.com/iwritec0de/wordpress-dev-docs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

CLI documentation generator for WordPress plugins and themes. Parses PHP, JS, and CSS source code and produces static developer documentation sites and MCP server references.

## Features

- **PHP parsing** — functions, classes, constants, hooks (actions & filters), REST API endpoints (`register_rest_route`), REST API fields (`register_rest_field`)
- **JS parsing** — Gutenberg block registration (`block.json`), WordPress JS APIs
- **CSS parsing** — design tokens and custom properties
- **Static site output** — Next.js 16 site with Tailwind CSS 4, sidebar nav, and FlexSearch-powered search
- **Skin system** — 8 built-in skins (`default`, `dark-pro`, `midnight`, `sandstone`, `sunset`, `syntax`, `terminal`, `wordpress`) plus custom skin JSON and token overrides
- **MDX guides** — author onboarding/tutorial content alongside auto-generated reference docs
- **MCP server** — exposes parsed references as a Model Context Protocol HTTP server
- **Validate command** — lint your plugin/theme source before generating docs
- **Collection mode** — document multiple plugins/themes as a monorepo
- **JSON output** — `--json` flag for CI/tooling integration

## Requirements

- Node.js 20+
- Any of npm 10+, pnpm 9+, or yarn (end users install the published package with whichever they prefer; the repo itself is developed with pnpm)

## Installation

```bash
npm install -g @iwritec0de/wpdocs
```

Or run without installing:

```bash
npx @iwritec0de/wpdocs <command>
```

## Commands

### `wpdocs init`

Interactively scaffold a `docs.config.json` in your plugin or theme directory.

```bash
wpdocs init ./my-plugin
```

### `wpdocs generate`

Parse source and generate a static documentation site.

```bash
wpdocs generate ./my-plugin
wpdocs generate ./my-plugin --output-dir ./docs-site
wpdocs generate ./my-plugin --skin dark-pro
wpdocs generate ./my-plugin --guides ./docs/guides
```

### `wpdocs validate`

Validate your plugin or theme source for common documentation issues before generating.

```bash
wpdocs validate ./my-plugin
wpdocs validate ./my-plugin --exclude 'tests/**' --exclude 'vendor/**'
wpdocs validate ./my-plugin --json
```

### `wpdocs preview`

Generate docs and serve a local preview.

```bash
wpdocs preview ./my-plugin
wpdocs preview ./my-plugin --port 3001
```

### `wpdocs mcp`

Start the MCP server to expose parsed references to AI tools.

```bash
wpdocs mcp ./my-plugin
wpdocs mcp ./my-plugin --port 8080
```

## Flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--config` | `-c` | Path to `docs.config.json` |
| `--output-dir` | `-o` / `--output` | Override output directory (default: `./docs-output`) |
| `--guides` | | Path to a folder of MDX guide content |
| `--skin` | | Built-in skin name or path to skin JSON |
| `--tokens` | | Path to token overrides JSON (layered on skin) |
| `--type` | | `plugin` \| `theme` \| `collection` |
| `--exclude` | | Glob patterns to exclude (repeatable) |
| `--port` | `-p` | Port for MCP/preview server (default: 3000) |
| `--verbose` | `-v` | Detailed output during generation |
| `--dry-run` | | Parse and report without writing output |
| `--json` | | Machine-readable JSON output (for CI/tooling) |

## Configuration

Create a `docs.config.json` at your plugin/theme root (or run `wpdocs init` to scaffold one):

```json
{
  "name": "My Plugin",
  "type": "plugin",
  "source": "./src",
  "skin": "default",
  "guides": "./docs/guides",
  "site": {
    "title": "My Plugin Docs",
    "description": "Developer documentation for My Plugin",
    "logo": "./assets/logo.svg",
    "githubUrl": "https://github.com/example/my-plugin",
    "navLinks": [
      { "label": "Support", "href": "https://example.com/support" }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Project name |
| `version` | `string?` | Project version |
| `type` | `"plugin" \| "theme" \| "collection"` | Project type (default: `"plugin"`) |
| `source` | `string` | Path to source root (relative to config, default: `"./"`) |
| `exclude` | `string[]` | Glob patterns to exclude (default: `["vendor/**", "node_modules/**"]`) |
| `output` | `string` | Output directory (default: `"./docs-output"`) |
| `guides` | `string?` | Path to MDX guide content folder |
| `skin` | `string?` | Built-in skin name or path to custom skin JSON |
| `tokens` | `string?` | Path to token overrides JSON (layered on skin) |
| `site.title` | `string?` | Documentation site title |
| `site.description` | `string?` | Documentation site description |
| `site.baseUrl` | `string` | Base URL path (default: `"/"`) |
| `site.logo` | `string?` | Path to logo image |
| `site.githubUrl` | `string?` | GitHub repo URL (shown in top nav) |
| `site.navLinks` | `{label, href}[]?` | External links in top navigation |
| `mcp.enabled` | `boolean` | Enable MCP reference output (default: `false`) |
| `mcp.output` | `string` | MCP output directory (default: `"./mcp-reference"`) |

### Skins

Built-in skins: `default`, `dark-pro`, `midnight`, `sandstone`, `sunset`, `syntax`, `terminal`, `wordpress`.

Use a built-in skin by name:

```json
{ "skin": "midnight" }
```

Or point to a custom skin JSON file:

```json
{ "skin": "./my-skin.json" }
```

Layer token overrides on top of any skin:

```json
{
  "skin": "default",
  "tokens": "./brand-tokens.json"
}
```

### Guides

Place MDX files in a guides directory organized by section:

```
docs/guides/
  intro/
    _meta.json          # { "title": "Getting Started", "order": 1 }
    welcome.mdx
    installation.mdx
  advanced/
    _meta.json
    hooks.mdx
```

Reference the guides folder in your config:

```json
{ "guides": "./docs/guides" }
```

### Collection mode

Document multiple plugins as a unified portal. Put a `docs.config.json` at the collection root:

```json
{
  "name": "My Plugin Suite",
  "type": "collection",
  "source": "./",
  "groups": [
    { "name": "Core", "plugins": ["my-core-plugin"] },
    { "name": "Extensions", "plugins": ["my-addon-a", "my-addon-b"] }
  ]
}
```

Each immediate subdirectory is parsed as a separate plugin. The output includes per-plugin sites, a collection index, and a combined MCP reference.

```bash
wpdocs generate ./my-plugin-suite
```

## Generated Site

The output is a static Next.js site with:

- **Overview** — plugin summary with stat cards (function/class/hook/endpoint counts)
- **PHP Reference** — functions, classes, and constants with params, return types, source links
- **Hooks** — actions and filters with dispatch arg counts and parameter tables
- **JavaScript API** — JS functions with the same detail as PHP reference
- **REST API** — endpoints with method badges, route paths, parameters, and custom fields
- **CSS Tokens** — design token listing with values and scopes
- **Guides** — MDX-authored content with callouts, code blocks, and tabs
- **Changelog** — parsed from `CHANGELOG.md`
- **Search** — FlexSearch-powered modal (`Cmd+K`) indexing all reference items and guides

## Demo Examples

Three example setups are included to exercise all three `type` modes:

### Single Plugin

```bash
wpdocs generate examples/example-plugin
```

A comprehensive WordPress plugin with hooks, REST API endpoints, REST fields, JS/CSS, block.json, guides, and a CHANGELOG.

### Block Theme

```bash
wpdocs generate examples/example-theme
```

A WordPress block theme with `style.css` header, `theme.json`, template parts, custom hooks, CSS design tokens, and guides.

### Plugin Collection

```bash
wpdocs generate examples/example-plugin-suite
```

A base plugin with two extension plugins demonstrating cross-plugin hook relationships, grouped REST endpoints, and collection mode output.

## Development

```bash
git clone https://github.com/iwritec0de/wordpress-dev-docs.git
cd wordpress-dev-docs
pnpm install

pnpm run dev -- generate ./examples/example-plugin       # One-shot run (exits when done)
pnpm run dev:watch -- preview ./examples/example-plugin  # Watch mode — CLI reruns on src changes
pnpm test                                                # Run tests
pnpm run test:coverage                                   # Coverage report
pnpm run typecheck                                       # Type check
pnpm run lint                                            # Lint
pnpm run build                                           # Production build
```

The repo uses **pnpm** as its package manager (pinned via `packageManager` in `package.json`). Enable it via [Corepack](https://nodejs.org/api/corepack.html) (`corepack enable`) or install directly (`npm install -g pnpm`).

## Project Structure

```
src/
  cli/          # Ink CLI app + commands (generate, init, validate, preview, mcp)
  parser/       # PHP, JS, CSS parsers + WordPress-specific extractors
  generator/    # Site scaffold + MCP reference builder
  config/       # Config schema (Zod) + loader
  validator/    # Source validation rules
  mcp-server/   # MCP server runtime (HTTP)
packages/
  site-template/ # Next.js site template + built-in skins
examples/
  example-plugin/       # Single WordPress plugin
  example-theme/        # WordPress block theme
  example-plugin-suite/ # Plugin collection (base + 2 extensions)
```

## License

MIT
