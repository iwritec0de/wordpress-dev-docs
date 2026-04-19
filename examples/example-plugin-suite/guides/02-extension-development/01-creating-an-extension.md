---
title: Creating an Extension
description: How to build a new extension that hooks into Example Base.
---

# Creating an Extension

Extensions are standard WordPress plugins that depend on Example Base. They use
actions and filters fired by the base plugin to add functionality.

## Minimum Skeleton

```php
<?php
/**
 * Plugin Name: Example Extension — My Feature
 * Description: Adds my feature to Example Base.
 * Requires Plugins: example-base
 */

add_action( 'plugins_loaded', function () {
    if ( ! function_exists( 'example_base_get_store' ) ) {
        return; // Base plugin not active
    }

    // Register your hooks here
    add_action( 'example_base_record_saved', 'my_feature_on_save', 10, 2 );
    add_filter( 'example_base_record_fields', 'my_feature_add_fields' );
}, 20 );
```

## Available Hooks

The base plugin provides these extension points:

| Hook | Type | When It Fires |
|------|------|---------------|
| `example_base_record_saved` | action | After a record is created or updated |
| `example_base_record_deleted` | action | After a record is removed |
| `example_base_record_fields` | filter | Before returning record fields from REST API |
| `example_base_store_init` | action | When the data store class is instantiated |

## Accessing the Data Store

```php
$store = example_base_get_store();
$record = $store->get( $record_id );
$store->update( $record_id, [ 'status' => 'processed' ] );
```

## Testing Your Extension

Activate the base plugin in your test environment, then activate your extension.
The base plugin includes a WP-CLI command for creating test records:

```bash
wp example-base create-test-data --count=50
```
