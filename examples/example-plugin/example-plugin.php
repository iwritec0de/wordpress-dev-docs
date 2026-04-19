<?php
/**
 * Plugin Name:       Example Plugin
 * Plugin URI:        https://example.com/plugins/example-plugin
 * Description:       A comprehensive example WordPress plugin demonstrating best practices for hooks, settings, REST API, and PHPDoc documentation. Used as a test fixture for wordpress-dev-docs.
 * Version:           1.2.0
 * Author:            Example Author
 * Author URI:        https://example.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       example-plugin
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 *
 * @package ExamplePlugin
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
define( 'EXAMPLE_PLUGIN_VERSION', '1.2.0' );

/**
 * Plugin directory path constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_PLUGIN_DIR', __DIR__ );

/**
 * Plugin directory URL constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Bootstrap the plugin after all plugins are loaded.
 *
 * Hooks into `plugins_loaded` to ensure all WordPress core functions
 * and other plugin dependencies are available before initialization.
 *
 * @since 1.0.0
 * @return void
 */
function example_plugin_init() {
	// Load plugin text domain for translations.
	load_plugin_textdomain(
		'example-plugin',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);

	// Load required files.
	require_once EXAMPLE_PLUGIN_DIR . '/includes/class-example.php';
	require_once EXAMPLE_PLUGIN_DIR . '/includes/functions.php';
	require_once EXAMPLE_PLUGIN_DIR . '/includes/rest-api.php';

	// Initialize the main plugin class.
	Example_Plugin::get_instance();
}
add_action( 'plugins_loaded', 'example_plugin_init' );

/**
 * Add plugin action links on the Plugins screen.
 *
 * Appends "Settings" and "Documentation" links to the plugin row
 * actions in the WordPress admin plugins list table.
 *
 * @since 1.0.0
 *
 * @param array  $links  Existing action links for this plugin.
 * @param string $file   Plugin basename (e.g. 'example-plugin/example-plugin.php').
 * @return array Modified action links with additional entries prepended.
 */
function example_plugin_action_links( $links, $file ) {
	if ( plugin_basename( __FILE__ ) !== $file ) {
		return $links;
	}

	$settings_url = admin_url( 'options-general.php?page=example-plugin' );
	$docs_url     = 'https://example.com/docs/example-plugin';

	$plugin_links = array(
		'<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'Settings', 'example-plugin' ) . '</a>',
		'<a href="' . esc_url( $docs_url ) . '" target="_blank">' . esc_html__( 'Documentation', 'example-plugin' ) . '</a>',
	);

	return array_merge( $plugin_links, $links );
}
add_filter( 'plugin_action_links', 'example_plugin_action_links', 10, 2 );
