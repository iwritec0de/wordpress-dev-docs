# Changelog

All notable changes to Example Plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Nothing yet.

---

## [1.2.0] — 2024-03-15

### Added
- Custom REST API endpoints registered under the `example-plugin/v1` namespace:
  - `GET /wp-json/example-plugin/v1/settings` — retrieve all or a single plugin setting (requires `manage_options`).
  - `POST /wp-json/example-plugin/v1/settings` — update one or more settings (requires `manage_options`).
  - `GET /wp-json/example-plugin/v1/status` — public endpoint returning plugin version and active status.
- `example_plugin_rest_permissions_check()` callback enforcing `manage_options` capability on write endpoints.
- `example_plugin_is_active()` utility function for checking initialization state from external code.
- `docs.config.json` configuration file for use with the wordpress-dev-docs CLI.

### Changed
- Admin JavaScript refactored to rely entirely on `wp.hooks` (`addAction`, `addFilter`, `doAction`, `applyFilters`) for all extensibility points.
- `Example_Plugin::register_rest_routes()` delegates to `example_plugin_register_rest_routes()` in `rest-api.php` for separation of concerns.
- `package` header in `readme.txt` updated to reflect new stable tag.

### Fixed
- Settings not persisting when `enable_feature_b` was toggled to `false` (falsy value was dropped by `wp_parse_args`).
- Admin notice dismiss button not working after a second save due to missing re-initialization call.

---

## [1.1.0] — 2023-11-08

### Added
- `example_plugin_is_active(): bool` helper function that returns `true` after the plugin class singleton is initialized.
- Dark mode support: `.dark-mode` CSS class on any ancestor element now overrides all design tokens to dark-friendly values.
- `--example-plugin-color-success`, `--example-plugin-color-warning`, and `--example-plugin-color-error` semantic colour tokens.

### Changed
- Text domain loading moved from `init` to `plugins_loaded` to match WordPress best practices.
- PHPDoc coverage expanded: all public methods, standalone functions, hooks, and filters now carry complete `@since`, `@param`, and `@return` tags.
- CSS refactored to use CSS custom properties throughout — hard-coded colour values removed.

### Fixed
- Translation strings using incorrect text domain `'example_plugin'` (underscored) instead of `'example-plugin'` (hyphenated).

### Deprecated
- Direct access to `Example_Plugin::$settings` property — use `Example_Plugin::get_settings( $key )` instead. The property visibility will be changed to `private` in a future major release.

---

## [1.0.0] — 2023-07-01

### Added
- Initial release of Example Plugin.
- `Example_Plugin` singleton class with:
  - `get_instance()` static factory method.
  - `init()` method registering all WordPress hooks.
  - `get_settings( $key, $default )` and `update_setting( $key, $value )` for settings management.
  - `apply_filters( 'example_plugin_settings', $defaults )` for extensible default settings.
  - `do_action( 'example_plugin_initialized', $this )` post-init hook.
- Standalone utility functions: `example_plugin_get_option()`, `example_plugin_format_price()`, `example_plugin_log()`.
- Admin settings page registered under **Settings > Example Plugin**.
- Front-end stylesheet with CSS custom property design tokens.
- Admin JavaScript using `wp.hooks` for initialization and settings filtering.

[Unreleased]: https://github.com/example/example-plugin/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/example/example-plugin/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/example/example-plugin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/example/example-plugin/releases/tag/v1.0.0
