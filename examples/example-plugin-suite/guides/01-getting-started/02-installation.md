---
title: Installation
description: How to install and activate the base plugin and extensions.
---

# Installation

## Installing the Base Plugin

1. Upload `example-base/` to `wp-content/plugins/`
2. Activate **Example Base** in the WordPress admin
3. Verify by visiting `/wp-json/example-base/v1/records` — you should get an empty JSON array

## Adding Extensions

Extensions are installed the same way as any WordPress plugin. They check for the
base plugin on activation and will deactivate themselves if it is missing.

```bash
# Install all three at once
wp plugin activate example-base example-extension-maps example-extension-analytics
```

## Activation Order

The base plugin must be activated first. Extensions register their hooks on
`plugins_loaded` at priority 20 (the base uses priority 10), so load order is
handled automatically by WordPress.

## Verifying the Installation

After activating all plugins, the status endpoint should report all components:

```bash
curl https://your-site.com/wp-json/example-base/v1/status
# {"base": true, "extensions": ["maps", "analytics"]}
```
