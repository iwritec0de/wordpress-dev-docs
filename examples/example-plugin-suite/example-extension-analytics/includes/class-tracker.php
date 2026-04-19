<?php
/**
 * Event tracker for item analytics.
 *
 * Records lifecycle events (create, delete) for items managed by the
 * base plugin and provides query methods for analytics data.
 *
 * @package    ExampleExtensionAnalytics
 * @subpackage ExampleExtensionAnalytics/includes
 * @since      1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Example_Analytics_Tracker
 *
 * Logs item lifecycle events to a custom table and provides methods to
 * query event history and aggregate statistics.
 *
 * @since 1.0.0
 */
class Example_Analytics_Tracker {

	/**
	 * Custom table name (without prefix).
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const TABLE_NAME = 'example_analytics_events';

	/**
	 * Track an item creation event.
	 *
	 * Called by the `example_base_item_created` action hook.
	 *
	 * @since 1.0.0
	 *
	 * @param int   $item_id The ID of the created item.
	 * @param array $data    The item data that was saved.
	 * @return void
	 */
	public function track_creation( $item_id, $data ) {
		$this->log_event( $item_id, 'created', $data );
	}

	/**
	 * Track an item deletion event.
	 *
	 * Called by the `example_base_item_deleted` action hook.
	 *
	 * @since 1.0.0
	 *
	 * @param int $item_id The ID of the deleted item.
	 * @return void
	 */
	public function track_deletion( $item_id ) {
		$this->log_event( $item_id, 'deleted' );
	}

	/**
	 * Get analytics stats for an item.
	 *
	 * Returns an aggregate of events for the given item, including
	 * view count and last activity timestamp.
	 *
	 * @since 1.0.0
	 *
	 * @param int $item_id The item ID.
	 * @return array{views: int, last_activity: string|null} Analytics summary.
	 */
	public function get_stats( $item_id ) {
		// Simulated stats.
		return array(
			'views'         => wp_rand( 0, 500 ),
			'last_activity' => current_time( 'mysql' ),
		);
	}

	/**
	 * Get the most recent analytics events.
	 *
	 * @since 1.0.0
	 *
	 * @param int $limit Maximum number of events to return. Default 10.
	 * @return array Array of event records with `item_id`, `type`, and `date` keys.
	 */
	public function get_recent_events( $limit = 10 ) {
		// Simulated event data.
		return array();
	}

	/**
	 * Log an event to the analytics table.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param int         $item_id The item ID.
	 * @param string      $type    Event type: 'created' or 'deleted'.
	 * @param array|null  $data    Optional associated data.
	 * @return void
	 */
	private function log_event( $item_id, $type, $data = null ) {
		// Simulated insert — would normally use $wpdb->insert().
	}
}
