---
title: REST API Integration
description: How extensions can add custom REST endpoints and fields alongside the base API.
---

# REST API Integration

The base plugin registers REST endpoints under `example-base/v1/`. Extensions
can add their own endpoints in the same namespace or register additional fields
on existing endpoints.

## Adding REST Fields

Use `example_base_record_fields` to inject extra fields into the record response:

```php
add_filter( 'example_base_record_fields', function ( $fields, $record_id ) {
    $fields['coordinates'] = get_post_meta( $record_id, '_geo_coordinates', true );
    return $fields;
}, 10, 2 );
```

## Registering Extension Endpoints

Keep your endpoints under a sub-namespace to avoid conflicts:

```php
add_action( 'rest_api_init', function () {
    register_rest_route( 'example-base/v1', '/maps/geocode', [
        'methods'  => 'POST',
        'callback' => 'maps_geocode_handler',
        'permission_callback' => function () {
            return current_user_can( 'edit_posts' );
        },
        'args' => [
            'address' => [
                'required' => true,
                'type'     => 'string',
            ],
        ],
    ] );
} );
```

## Authentication

All base endpoints that modify data require `manage_options`. Extension endpoints
should follow the same pattern or document their capability requirements clearly.
The base provides a reusable permission callback:

```php
$check = example_base_rest_permission( 'edit_posts' );
// Returns a closure suitable for 'permission_callback'
```
