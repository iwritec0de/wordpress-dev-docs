---
title: Theme Structure
description: Overview of the Example Theme file and directory layout.
---

# Theme Structure

Example Theme follows the standard WordPress block theme layout:

```
example-theme/
  style.css              # Theme header + design tokens
  functions.php          # Theme setup, hooks, enqueues
  theme.json             # Block editor settings (colors, fonts, spacing)
  templates/
    index.html           # Main query loop template
    single.html          # Single post template
    page.html            # Static page template
  parts/
    header.html          # Header template part
    footer.html          # Footer template part
  assets/
    css/editor.css       # Editor-specific styles
    js/navigation.js     # Front-end navigation script
```

## Key Files

- **`style.css`** contains the theme header (name, version, author) and CSS
  custom property design tokens
- **`functions.php`** registers theme supports, menus, widget areas, and
  provides custom hooks for extensibility
- **`theme.json`** configures the block editor: color palette, font families,
  font sizes, spacing units, and layout widths

## Custom Hooks

The theme provides several hooks for child themes and plugins:

- `example_theme_after_setup` — fires after theme supports are registered
- `example_theme_enqueue_assets` — fires after core assets are enqueued
- `example_theme_body_classes` — filter body CSS classes
- `example_theme_copyright` — filter footer copyright HTML
- `example_theme_reading_wpm` — filter words-per-minute rate
