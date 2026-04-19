---
title: Design Tokens
description: How to customize Example Theme's visual appearance using CSS custom properties.
---

# Design Tokens

Example Theme uses CSS custom properties (design tokens) defined on `:root`
in `style.css`. You can override any token in a child theme or custom CSS
to change the look without editing theme files directly.

## Available Tokens

### Colors

| Token | Default | Purpose |
|-------|---------|---------|
| `--example-theme-color-primary` | `#1d4ed8` | Buttons, links, focus rings |
| `--example-theme-color-secondary` | `#9333ea` | Badges, decorative elements |
| `--example-theme-color-background` | `#ffffff` | Page background |
| `--example-theme-color-text` | `#1f2937` | Body text |
| `--example-theme-color-text-muted` | `#6b7280` | Captions, meta text |
| `--example-theme-color-border` | `#e5e7eb` | Borders, separators |
| `--example-theme-color-surface` | `#f9fafb` | Card backgrounds |

### Typography

| Token | Default | Purpose |
|-------|---------|---------|
| `--example-theme-font-family` | Inter, system-ui | Body font |
| `--example-theme-font-family-heading` | Lexend, system-ui | Heading font |
| `--example-theme-font-size-base` | `1rem` | Body text size |

## Overriding in a Child Theme

Add a `style.css` in your child theme with overrides:

```css
:root {
  --example-theme-color-primary: #059669;
  --example-theme-font-family: "IBM Plex Sans", sans-serif;
}
```

All components that reference these tokens will update automatically.
