<?php
/**
 * Plugin Name:       Example Base
 * Plugin URI:        https://example.com/plugins/example-base
 * Description:       Core data management plugin providing a shared data store, REST API, and extensibility hooks for the Example Plugin Suite.
 * Version:           2.0.0
 * Author:            Example Author
 * Author URI:        https://example.com
 * License:           GPL-2.0-or-later
 * Text Domain:       example-base
 * Requires at least: 6.0
 * Requires PHP:      8.0
 *
 * @package ExampleBase
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin version constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_BASE_VERSION', '2.0.0' );

/**
 * Plugin directory path constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_BASE_DIR', __DIR__ );

// Load components.
require_once EXAMPLE_BASE_DIR . '/includes/class-data-store.php';
require_once EXAMPLE_BASE_DIR . '/includes/rest-api.php';

/**
 * Initialize the base plugin.
 *
 * Fires the `example_base_loaded` action after all components are loaded
 * so extensions can safely hook in.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_base_init() {
	/**
	 * Fires after Example Base has finished loading all components.
	 *
	 * Extensions should hook into this action to register their own
	 * functionality that depends on base plugin classes being available.
	 *
	 * @since 1.0.0
	 */
	do_action( 'example_base_loaded' );
}
add_action( 'plugins_loaded', 'example_base_init' );
