---
title: Suite Overview
description: Architecture overview of Example Plugin Suite — a base plugin with extension system.
---

# Suite Overview

Example Plugin Suite is a collection of WordPress plugins built around a shared
base. The architecture follows a common pattern in the WordPress ecosystem:

- **example-base** — Core data store, REST API, and hook system
- **example-extension-maps** — Adds geocoding and map display via the base hooks
- **example-extension-analytics** — Adds event tracking and a dashboard widget

## How It Works

The base plugin fires actions and filters at key points in its lifecycle.
Extensions hook into these to add functionality without modifying base code.

```php
// Base plugin fires this after saving a record:
do_action( 'example_base_record_saved', $record_id, $data );

// The maps extension listens:
add_action( 'example_base_record_saved', [ $map_provider, 'geocode_record' ], 10, 2 );

// The analytics extension also listens:
add_action( 'example_base_record_saved', [ $tracker, 'track_event' ], 10, 2 );
```

## Requirements

- WordPress 6.0+
- PHP 8.0+
- The base plugin must be active before activating any extension
