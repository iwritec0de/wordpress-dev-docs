---
title: Custom Filters
description: Extend example-plugin output with your own filter callbacks.
order: 1
---

# Custom Filters

example-plugin exposes a handful of filters you can hook into to modify
output before it reaches the browser. The most commonly used one is
`example_plugin_output`, which wraps the string returned by
[`example_func()`](/php/functions/example_func).

```php
add_filter( 'example_plugin_output', function ( $output ) {
    return strtoupper( $output );
} );
```

Filters run in the standard WordPress order; use the `$priority` argument
if you need to run before or after another plugin's callback.
