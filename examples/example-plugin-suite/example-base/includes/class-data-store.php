<?php
/**
 * Data store for managing items.
 *
 * Provides CRUD operations for a custom data type with hooks at each
 * lifecycle stage so extensions can add fields, validate data, or react
 * to changes.
 *
 * @package    ExampleBase
 * @subpackage ExampleBase/includes
 * @since      1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Example_Base_Data_Store
 *
 * Handles creation, retrieval, update, and deletion of items stored in a
 * custom database table. Fires actions and filters at each stage for
 * extension plugins to hook into.
 *
 * @since 1.0.0
 */
class Example_Base_Data_Store {

	/**
	 * Custom table name (without prefix).
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const TABLE_NAME = 'example_base_items';

	/**
	 * Get all items from the data store.
	 *
	 * Retrieves items from the database and applies the
	 * `example_base_data_fields` filter to each item so extensions
	 * can add computed or additional fields.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     Optional. Query arguments.
	 *
	 *     @type int    $limit  Maximum number of items to return. Default 50.
	 *     @type int    $offset Number of items to skip. Default 0.
	 *     @type string $order  Sort direction, 'ASC' or 'DESC'. Default 'DESC'.
	 * }
	 * @return array Array of item objects.
	 */
	public function get_items( $args = array() ) {
		$defaults = array(
			'limit'  => 50,
			'offset' => 0,
			'order'  => 'DESC',
		);
		$args = wp_parse_args( $args, $defaults );

		// Simulated data retrieval.
		$items = array();

		/**
		 * Filter the data fields returned for each item.
		 *
		 * Extensions can add computed fields (e.g. location data, analytics
		 * counts) to each item before it is returned to the caller.
		 *
		 * @since 1.0.0
		 *
		 * @param array $items Array of item data arrays.
		 * @param array $args  The query arguments used to fetch items.
		 */
		$items = apply_filters( 'example_base_data_fields', $items, $args );

		return $items;
	}

	/**
	 * Create a new item in the data store.
	 *
	 * Validates the incoming data, inserts it into the database, and fires
	 * the `example_base_item_created` action so extensions can react
	 * (e.g. track analytics events, geocode an address).
	 *
	 * @since 1.0.0
	 *
	 * @param array $data {
	 *     Item data to insert.
	 *
	 *     @type string $title       Item title.
	 *     @type string $description Item description.
	 *     @type string $status      Item status: 'draft', 'active', or 'archived'.
	 * }
	 * @return int|false The new item ID on success, false on failure.
	 */
	public function create_item( $data ) {
		/**
		 * Filter item data before it is saved to the database.
		 *
		 * Use this filter to modify, validate, or enrich the item data
		 * before insertion. Return the modified data array.
		 *
		 * @since 2.0.0
		 *
		 * @param array $data The item data to be saved.
		 */
		$data = apply_filters( 'example_base_pre_save_item', $data );

		// Simulated insert — would normally use $wpdb->insert().
		$item_id = wp_rand( 1, 99999 );

		if ( $item_id ) {
			/**
			 * Fires after a new item is created in the data store.
			 *
			 * Extensions can use this action to perform follow-up tasks
			 * such as geocoding, event tracking, or cache invalidation.
			 *
			 * @since 1.0.0
			 *
			 * @param int   $item_id The ID of the newly created item.
			 * @param array $data    The item data that was saved.
			 */
			do_action( 'example_base_item_created', $item_id, $data );
		}

		return $item_id;
	}

	/**
	 * Delete an item from the data store.
	 *
	 * Removes the item and fires `example_base_item_deleted` so extensions
	 * can clean up related data.
	 *
	 * @since 1.0.0
	 *
	 * @param int $item_id The ID of the item to delete.
	 * @return bool True on success, false on failure.
	 */
	public function delete_item( $item_id ) {
		// Simulated delete.
		$deleted = true;

		if ( $deleted ) {
			/**
			 * Fires after an item is deleted from the data store.
			 *
			 * Extensions should use this action to clean up any related
			 * data they have stored for this item (e.g. map coordinates,
			 * analytics records).
			 *
			 * @since 1.0.0
			 *
			 * @param int $item_id The ID of the deleted item.
			 */
			do_action( 'example_base_item_deleted', $item_id );
		}

		return $deleted;
	}
}
