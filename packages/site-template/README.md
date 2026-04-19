# @iwritec0de/wpdocs-site-template

Next.js documentation site template for [wpdocs](https://github.com/your-org/wordpress-dev-docs).

## Overview

This package contains the Next.js template files that `wpdocs generate` scaffolds into your output directory. It is published separately from the CLI so it can be versioned independently and kept lean.

## Contents

```
template/
├── package.json          ← Next.js project deps (next, react, react-dom)
├── tsconfig.json         ← TypeScript config for the generated site
├── next.config.js        ← Static export config
├── app/
│   ├── layout.tsx        ← Root layout (metadata, globals.css)
│   ├── globals.css       ← Base styles
│   ├── page.tsx          ← Overview / home page
│   ├── php/
│   │   ├── functions/page.tsx
│   │   └── classes/page.tsx
│   ├── hooks/
│   │   ├── actions/page.tsx
│   │   └── filters/page.tsx
│   ├── css/
│   │   └── tokens/page.tsx
│   └── changelog/page.tsx
├── components/
│   └── Sidebar.tsx
└── public/
    └── data/
        └── site-data.json  ← Populated at generate time
```

## Usage

The template is consumed by the CLI generator at runtime — you do not use this package directly.

```javascript
import { TEMPLATE_DIR } from '@iwritec0de/wpdocs-site-template';
// TEMPLATE_DIR points to the template/ subdirectory
```

## Package names

- CLI: `@iwritec0de/wpdocs-cli`
- Site template: `@iwritec0de/wpdocs-site-template`
