# Contributing to wpdocs

Thanks for your interest. This is a small project but contributions are welcome — bug reports, feature requests, and PRs.

## Getting set up

```bash
git clone https://github.com/iwritec0de/wordpress-dev-docs.git
cd wordpress-dev-docs
pnpm install
pnpm test
```

Node 20 or 22 is required. The repo uses **pnpm** (pinned via `packageManager` in `package.json`). Enable it via Corepack (`corepack enable`) or install directly (`npm install -g pnpm`).

## Development loop

```bash
# One-shot run — exits when the command finishes.
pnpm run dev -- generate ./examples/example-plugin

# Same, but against the theme fixture
pnpm run dev -- generate ./examples/example-theme

# Or the collection fixture
pnpm run dev -- generate ./examples/example-plugin-suite

# Watch mode — reruns on src/ changes. Useful for long-lived commands
# like `preview` or `mcp` while iterating on the CLI code.
pnpm run dev:watch -- preview ./examples/example-plugin
```

Generated sites are self-contained and don't use pnpm — users run whichever package manager they prefer inside the output directory. `cd` into `<target>/docs-output/` and run `npm install && npm run dev` (or `pnpm install && pnpm run dev`) to serve it in a browser.

## Running checks locally

Before pushing a PR:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm test
pnpm run build
```

CI runs the same five jobs on Node 20 and Node 22.

## Branching

- `main` is protected. All work lands on `develop` via PRs.
- Feature branches: `feature/<short-description>` or `feature/<task-id>-<description>`.
- Bugfixes: `bugfix/<short-description>`.

## Repository layout

```
src/
  cli/          # Ink CLI app + commands (generate, init, validate, preview, mcp)
  parser/       # PHP, JS, CSS parsers + WordPress-specific extractors
  generator/    # Site scaffold + MCP reference builder
  config/       # Config schema (Zod) + loader
  overrides/    # User-supplied tip/code overrides loader + merge engine
  validator/    # Source validation rules
  mcp-server/   # MCP server runtime (HTTP)
  lib/          # Small shared helpers

packages/
  site-template/  # Next.js 16 site template + 8 built-in skins

examples/
  example-plugin/       # Single WordPress plugin fixture
  example-theme/        # WordPress block theme fixture
  example-plugin-suite/ # Plugin collection fixture
```

## Adding a parser rule

1. Add the extraction logic under `src/parser/<php|js|css>/` or `src/parser/wordpress/` for WP-specific patterns.
2. Add a test alongside in `__tests__/`.
3. If the output needs to surface in the generated site, update `src/generator/site/nav.ts` and the relevant page under `packages/site-template/template/app/`.
4. If it needs to surface in the MCP reference, update `src/generator/mcp/` and the MCP server routes in `src/mcp-server/`.

## Adding a skin

1. Create `packages/site-template/skins/<name>.json` following the shape of `default.json`.
2. Add the name to `BUILT_IN_SKINS` in `src/generator/site/tokens.ts`.
3. Add tests under `src/generator/site/__tests__/tokens.test.ts` for any unusual token values.

Skin tokens are validated against a Zod schema — `xl` radius and dark overrides are optional.

## Tests

Tests live next to their source in `__tests__/` directories, named `*.test.ts` or `*.test.tsx`. We use Vitest. Run a single file with `npx vitest run <path>`.

## Commit messages

Conventional-style prefixes are preferred but not required: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`. Include scope when helpful: `feat(parser): …`, `fix(site-template): …`.

## Filing issues

- **Bugs:** include the command run, the expected vs actual output, and the plugin/theme structure (sanitized) that reproduces it.
- **Features:** describe the use case first, not the implementation.

## License

By contributing you agree that your contributions will be licensed under the repository's [MIT license](LICENSE).
