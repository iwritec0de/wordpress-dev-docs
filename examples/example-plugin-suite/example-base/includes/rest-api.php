<?php
/**
 * REST API endpoints for the base plugin.
 *
 * Registers routes under the `example-base/v1` namespace for item
 * CRUD operations and a public status endpoint.
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
 * Register REST API routes for the base plugin.
 *
 * Called from `rest_api_init`. Registers GET/POST/DELETE endpoints
 * for items and a public status endpoint.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_base_register_rest_routes() {
	// GET /items — list all items.
	register_rest_route(
		'example-base/v1',
		'/items',
		array(
			'methods'             => 'GET',
			'callback'            => 'example_base_rest_get_items',
			'permission_callback' => '__return_true',
			'args'                => array(
				'limit' => array(
					'type'        => 'integer',
					'default'     => 50,
					'description' => 'Maximum number of items to return.',
				),
				'offset' => array(
					'type'        => 'integer',
					'default'     => 0,
					'description' => 'Number of items to skip.',
				),
			),
		)
	);

	// POST /items — create a new item.
	register_rest_route(
		'example-base/v1',
		'/items',
		array(
			'methods'             => 'POST',
			'callback'            => 'example_base_rest_create_item',
			'permission_callback' => 'example_base_rest_can_manage',
			'args'                => array(
				'title' => array(
					'type'        => 'string',
					'required'    => true,
					'description' => 'The item title.',
				),
				'description' => array(
					'type'        => 'string',
					'default'     => '',
					'description' => 'The item description.',
				),
				'status' => array(
					'type'        => 'string',
					'default'     => 'draft',
					'enum'        => array( 'draft', 'active', 'archived' ),
					'description' => 'The item status.',
				),
			),
		)
	);

	// DELETE /items/(?P<id>\d+) — delete an item.
	register_rest_route(
		'example-base/v1',
		'/items/(?P<id>\d+)',
		array(
			'methods'             => 'DELETE',
			'callback'            => 'example_base_rest_delete_item',
			'permission_callback' => 'example_base_rest_can_manage',
			'args'                => array(
				'id' => array(
					'type'        => 'integer',
					'required'    => true,
					'description' => 'The item ID to delete.',
				),
			),
		)
	);

	// GET /status — public health check.
	register_rest_route(
		'example-base/v1',
		'/status',
		array(
			'methods'             => 'GET',
			'callback'            => 'example_base_rest_status',
			'permission_callback' => '__return_true',
		)
	);

	/**
	 * Filter the REST API response data before it is returned.
	 *
	 * Extensions can modify response payloads (e.g. inject additional
	 * fields or transform values) for any base plugin endpoint.
	 *
	 * @since 1.0.0
	 *
	 * @param array            $response The response data array.
	 * @param \WP_REST_Request $request  The current REST request object.
	 */
	// Note: This filter is applied inside each callback, documented here for reference.
}
add_action( 'rest_api_init', 'example_base_register_rest_routes' );

/**
 * Handle GET /items request.
 *
 * @since 1.0.0
 *
 * @param \WP_REST_Request $request The REST request object.
 * @return \WP_REST_Response
 */
function example_base_rest_get_items( $request ) {
	$store = new Example_Base_Data_Store();
	$items = $store->get_items(
		array(
			'limit'  => $request->get_param( 'limit' ),
			'offset' => $request->get_param( 'offset' ),
		)
	);

	/** This filter is documented in rest-api.php */
	$items = apply_filters( 'example_base_rest_response', $items, $request );

	return rest_ensure_response( $items );
}

/**
 * Handle POST /items request.
 *
 * @since 1.0.0
 *
 * @param \WP_REST_Request $request The REST request object.
 * @return \WP_REST_Response|\WP_Error
 */
function example_base_rest_create_item( $request ) {
	$store   = new Example_Base_Data_Store();
	$item_id = $store->create_item(
		array(
			'title'       => $request->get_param( 'title' ),
			'description' => $request->get_param( 'description' ),
			'status'      => $request->get_param( 'status' ),
		)
	);

	if ( ! $item_id ) {
		return new \WP_Error( 'create_failed', 'Could not create item.', array( 'status' => 500 ) );
	}

	return rest_ensure_response( array( 'id' => $item_id ) );
}

/**
 * Handle DELETE /items/(?P<id>\d+) request.
 *
 * @since 1.0.0
 *
 * @param \WP_REST_Request $request The REST request object.
 * @return \WP_REST_Response|\WP_Error
 */
function example_base_rest_delete_item( $request ) {
	$store   = new Example_Base_Data_Store();
	$deleted = $store->delete_item( $request->get_param( 'id' ) );

	if ( ! $deleted ) {
		return new \WP_Error( 'delete_failed', 'Could not delete item.', array( 'status' => 500 ) );
	}

	return rest_ensure_response( array( 'deleted' => true ) );
}

/**
 * Return public status information.
 *
 * @since 1.0.0
 *
 * @param \WP_REST_Request $request The REST request object.
 * @return \WP_REST_Response
 */
function example_base_rest_status( $request ) {
	return rest_ensure_response(
		array(
			'version' => EXAMPLE_BASE_VERSION,
			'status'  => 'active',
		)
	);
}

/**
 * Permission callback: check if the current user can manage items.
 *
 * @since 1.0.0
 *
 * @return bool True if the user has the `manage_options` capability.
 */
function example_base_rest_can_manage() {
	return current_user_can( 'manage_options' );
}
