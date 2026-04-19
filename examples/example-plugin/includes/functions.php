<?php
/**
 * Standalone utility functions for Example Plugin.
 *
 * These functions provide a procedural API that wraps the main plugin class
 * and exposes commonly used operations without requiring a class instance.
 *
 * @package    ExamplePlugin
 * @subpackage ExamplePlugin/includes
 * @since      1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Retrieve a plugin option value from WordPress options table.
 *
 * Wraps `get_option()` with a namespaced option name and provides
 * a consistent default fallback for all plugin options.
 *
 * @since 1.0.0
 *
 * @param string $key     The option key (without plugin prefix).
 * @param mixed  $default Value to return when the option does not exist. Default null.
 * @return mixed The option value, or $default if the option is not found.
 */
function example_plugin_get_option( $key, $default = null ): mixed {
	$option_name = 'example_plugin_' . sanitize_key( $key );

	return get_option( $option_name, $default );
}

/**
 * Format a monetary amount as a localized price string.
 *
 * Produces a human-readable price string (e.g. "$19.99 USD") using
 * PHP's `number_format()` for consistent decimal and thousands separators.
 *
 * @since 1.0.0
 *
 * @param float  $amount   The numeric amount to format. Must be non-negative.
 * @param string $currency ISO 4217 currency code (e.g. 'USD', 'EUR'). Default 'USD'.
 * @return string Formatted price string including symbol and currency code.
 */
function example_plugin_format_price( $amount, $currency = 'USD' ): string {
	$symbols = array(
		'USD' => '$',
		'EUR' => '€',
		'GBP' => '£',
		'CAD' => 'CA$',
		'AUD' => 'AU$',
	);

	$symbol    = isset( $symbols[ $currency ] ) ? $symbols[ $currency ] : $currency . ' ';
	$formatted = number_format( (float) $amount, 2 );

	return $symbol . $formatted . ' ' . esc_html( $currency );
}

/**
 * Write a message to the WordPress debug log (if WP_DEBUG_LOG is enabled).
 *
 * Prefixes all messages with `[ExamplePlugin]` and the log level so they
 * are easy to filter in the debug log file.
 *
 * @since 1.0.0
 *
 * @param string $message The message to log. Will not be escaped — avoid
 *                        including sensitive data.
 * @param string $level   Severity level: 'debug', 'info', 'warning', or 'error'.
 *                        Default 'info'.
 * @return void
 */
function example_plugin_log( $message, $level = 'info' ): void {
	if ( ! defined( 'WP_DEBUG_LOG' ) || ! WP_DEBUG_LOG ) {
		return;
	}

	$valid_levels = array( 'debug', 'info', 'warning', 'error' );
	$level        = in_array( $level, $valid_levels, true ) ? $level : 'info';

	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	error_log(
		sprintf(
			'[ExamplePlugin][%s] %s',
			strtoupper( $level ),
			$message
		)
	);
}

/**
 * Check whether Example Plugin is fully activated and initialized.
 *
 * Returns true only after `plugins_loaded` has fired and the plugin class
 * singleton has been created. Useful for conditional logic in other plugins
 * or themes that depend on Example Plugin.
 *
 * @since 1.1.0
 *
 * @return bool True if the plugin is active and initialized, false otherwise.
 */
function example_plugin_is_active(): bool {
	return (
		class_exists( 'Example_Plugin' ) &&
		null !== Example_Plugin::get_instance()
	);
}
