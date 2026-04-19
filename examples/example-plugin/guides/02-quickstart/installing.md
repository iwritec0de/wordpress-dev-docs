# Installing

Drop `example-plugin` into your `wp-content/plugins/` directory and activate
it from the WordPress admin dashboard. No database migrations run on
activation — the plugin is safe to toggle on and off during development.

Once active, call `example_func()` from anywhere in your theme or another
plugin to verify the install is working.
