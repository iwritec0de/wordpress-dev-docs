# Changelog

All notable changes to Example Theme are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Nothing yet.

---

## [1.0.0] — 2024-06-01

### Added
- Initial release of Example Theme.
- Block theme with `theme.json` v3 settings (colors, typography, spacing, layout).
- Template files: `index.html`, `single.html`, `page.html`.
- Template parts: `header.html`, `footer.html`.
- `functions.php` with:
  - Theme supports: `wp-block-styles`, `editor-styles`, `align-wide`, `responsive-embeds`, `post-thumbnails`, `title-tag`, `html5`.
  - Navigation menus: primary and footer.
  - Widget areas: sidebar and footer.
  - Custom image size: `example-theme-featured` (1200x630).
- Custom actions: `example_theme_after_setup`, `example_theme_enqueue_assets`.
- Custom filters: `example_theme_body_classes`, `example_theme_copyright`, `example_theme_reading_wpm`.
- CSS custom property design tokens in `style.css`.
- Editor styles in `assets/css/editor.css`.
- Responsive navigation script in `assets/js/navigation.js`.
- Getting started and customization guides.

[Unreleased]: https://github.com/example/example-theme/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/example/example-theme/releases/tag/v1.0.0
