<?php
/**
 * Plugin Name:       Example Extension — Analytics
 * Plugin URI:        https://example.com/plugins/example-extension-analytics
 * Description:       Tracks item lifecycle events for the Example Base plugin. Logs creation and deletion events and provides an admin dashboard widget.
 * Version:           1.0.0
 * Author:            Example Author
 * Author URI:        https://example.com
 * License:           GPL-2.0-or-later
 * Text Domain:       example-extension-analytics
 * Requires at least: 6.0
 * Requires PHP:      8.0
 *
 * @package ExampleExtensionAnalytics
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Analytics extension version constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_ANALYTICS_VERSION', '1.0.0' );

require_once __DIR__ . '/includes/class-tracker.php';

/**
 * Initialize the analytics extension after the base plugin loads.
 *
 * Hooks into `example_base_loaded` to register event tracking on
 * item lifecycle actions.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_analytics_init() {
	$tracker = new Example_Analytics_Tracker();

	// Track item creation events.
	add_action( 'example_base_item_created', array( $tracker, 'track_creation' ), 10, 2 );

	// Track item deletion events.
	add_action( 'example_base_item_deleted', array( $tracker, 'track_deletion' ), 10, 1 );

	// Add analytics data to REST responses.
	add_filter( 'example_base_rest_response', 'example_analytics_add_stats', 20, 2 );

	// Add analytics widget to admin dashboard.
	add_action( 'wp_dashboard_setup', 'example_analytics_register_dashboard_widget' );

	/**
	 * Fires after the analytics extension has finished initializing.
	 *
	 * @since 1.0.0
	 *
	 * @param Example_Analytics_Tracker $tracker The tracker instance.
	 */
	do_action( 'example_analytics_loaded', $tracker );
}
add_action( 'example_base_loaded', 'example_analytics_init' );

/**
 * Add analytics summary to REST API responses.
 *
 * Appends a `_analytics` object to each item with view count and
 * last accessed timestamp.
 *
 * @since 1.0.0
 *
 * @param array            $response The REST response data.
 * @param \WP_REST_Request $request  The current request object.
 * @return array Modified response with analytics data.
 */
function example_analytics_add_stats( $response, $request ) {
	if ( ! is_array( $response ) ) {
		return $response;
	}

	$tracker = new Example_Analytics_Tracker();

	foreach ( $response as &$item ) {
		$item_id = $item['id'] ?? 0;
		$item['_analytics'] = $tracker->get_stats( $item_id );
	}

	return $response;
}

/**
 * Register the analytics dashboard widget.
 *
 * Adds a widget to the WordPress admin dashboard showing recent
 * item activity. Only visible to users with `manage_options`.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_analytics_register_dashboard_widget() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	wp_add_dashboard_widget(
		'example_analytics_widget',
		__( 'Item Analytics', 'example-extension-analytics' ),
		'example_analytics_render_dashboard_widget'
	);
}

/**
 * Render the analytics dashboard widget HTML.
 *
 * Displays a summary of recent item creation and deletion events.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_analytics_render_dashboard_widget() {
	$tracker = new Example_Analytics_Tracker();
	$recent  = $tracker->get_recent_events( 10 );

	if ( empty( $recent ) ) {
		echo '<p>' . esc_html__( 'No recent activity.', 'example-extension-analytics' ) . '</p>';
		return;
	}

	echo '<ul>';
	foreach ( $recent as $event ) {
		printf(
			'<li>%s — Item #%d (%s)</li>',
			esc_html( $event['date'] ),
			intval( $event['item_id'] ),
			esc_html( $event['type'] )
		);
	}
	echo '</ul>';
}
