<?php
/**
 * Plugin Name:       Example Extension — Maps
 * Plugin URI:        https://example.com/plugins/example-extension-maps
 * Description:       Adds location fields and map display to items managed by Example Base. Hooks into the base plugin's data filters and actions.
 * Version:           1.0.0
 * Author:            Example Author
 * Author URI:        https://example.com
 * License:           GPL-2.0-or-later
 * Text Domain:       example-extension-maps
 * Requires at least: 6.0
 * Requires PHP:      8.0
 *
 * @package ExampleExtensionMaps
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Maps extension version constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_MAPS_VERSION', '1.0.0' );

require_once __DIR__ . '/includes/class-map-provider.php';

/**
 * Initialize the maps extension after the base plugin loads.
 *
 * Hooks into `example_base_loaded` to ensure all base plugin classes
 * are available before registering map functionality.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_maps_init() {
	// Add location fields to items.
	add_filter( 'example_base_data_fields', 'example_maps_add_location_fields', 10, 2 );

	// Geocode new items on creation.
	add_action( 'example_base_item_created', 'example_maps_geocode_item', 10, 2 );

	// Clean up map data on deletion.
	add_action( 'example_base_item_deleted', 'example_maps_cleanup_location', 10, 1 );

	// Add map coordinates to REST responses.
	add_filter( 'example_base_rest_response', 'example_maps_enrich_rest_response', 10, 2 );

	// Register map-specific REST endpoint.
	add_action( 'rest_api_init', 'example_maps_register_rest_routes' );

	/**
	 * Fires after the maps extension has finished initializing.
	 *
	 * @since 1.0.0
	 */
	do_action( 'example_maps_loaded' );
}
add_action( 'example_base_loaded', 'example_maps_init' );

/**
 * Add location fields to each item returned by the data store.
 *
 * Appends `latitude`, `longitude`, and `address` fields to the item
 * data retrieved from the base plugin's data store.
 *
 * @since 1.0.0
 *
 * @param array $items Array of item data arrays.
 * @param array $args  The query arguments used to fetch items.
 * @return array Modified items with location fields appended.
 */
function example_maps_add_location_fields( $items, $args ) {
	$provider = new Example_Maps_Provider();

	foreach ( $items as &$item ) {
		$location       = $provider->get_location( $item['id'] ?? 0 );
		$item['latitude']  = $location['lat'] ?? null;
		$item['longitude'] = $location['lng'] ?? null;
		$item['address']   = $location['address'] ?? '';
	}

	return $items;
}

/**
 * Geocode a newly created item's address.
 *
 * Triggered by the `example_base_item_created` action. Looks for an
 * `address` field in the item data and geocodes it to latitude/longitude.
 *
 * @since 1.0.0
 *
 * @param int   $item_id The ID of the newly created item.
 * @param array $data    The item data that was saved.
 * @return void
 */
function example_maps_geocode_item( $item_id, $data ) {
	if ( empty( $data['address'] ) ) {
		return;
	}

	$provider = new Example_Maps_Provider();
	$provider->geocode_and_save( $item_id, $data['address'] );
}

/**
 * Clean up location data when an item is deleted.
 *
 * Triggered by the `example_base_item_deleted` action.
 *
 * @since 1.0.0
 *
 * @param int $item_id The ID of the deleted item.
 * @return void
 */
function example_maps_cleanup_location( $item_id ) {
	$provider = new Example_Maps_Provider();
	$provider->delete_location( $item_id );
}

/**
 * Enrich REST API responses with map coordinates.
 *
 * Adds `map_url` field to each item in REST responses.
 *
 * @since 1.0.0
 *
 * @param array            $response The REST response data.
 * @param \WP_REST_Request $request  The current request object.
 * @return array Modified response with map URLs.
 */
function example_maps_enrich_rest_response( $response, $request ) {
	if ( ! is_array( $response ) ) {
		return $response;
	}

	foreach ( $response as &$item ) {
		if ( ! empty( $item['latitude'] ) && ! empty( $item['longitude'] ) ) {
			$item['map_url'] = sprintf(
				'https://maps.example.com/?lat=%s&lng=%s',
				$item['latitude'],
				$item['longitude']
			);
		}
	}

	return $response;
}

/**
 * Register REST routes specific to the maps extension.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_maps_register_rest_routes() {
	register_rest_route(
		'example-maps/v1',
		'/geocode',
		array(
			'methods'             => 'POST',
			'callback'            => 'example_maps_rest_geocode',
			'permission_callback' => 'example_base_rest_can_manage',
			'args'                => array(
				'address' => array(
					'type'        => 'string',
					'required'    => true,
					'description' => 'The address to geocode.',
				),
			),
		)
	);
}

/**
 * Handle POST /geocode request.
 *
 * @since 1.0.0
 *
 * @param \WP_REST_Request $request The REST request object.
 * @return \WP_REST_Response
 */
function example_maps_rest_geocode( $request ) {
	$provider = new Example_Maps_Provider();
	$result   = $provider->geocode( $request->get_param( 'address' ) );

	return rest_ensure_response( $result );
}
