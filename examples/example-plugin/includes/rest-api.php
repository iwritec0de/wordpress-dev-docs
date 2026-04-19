<?php
/**
 * REST API route registration for Example Plugin.
 *
 * Registers custom REST API endpoints under the `example-plugin/v1` namespace.
 * All endpoints require authentication and validate permissions via callbacks.
 *
 * @package    ExamplePlugin
 * @subpackage ExamplePlugin/includes
 * @since      1.2.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register all REST API routes for Example Plugin.
 *
 * Should be called on the `rest_api_init` action. Registers a `/settings`
 * endpoint that supports both GET (read) and POST (write) requests.
 *
 * @since 1.2.0
 *
 * @return void
 */
function example_plugin_register_rest_routes() {
	register_rest_route(
		'example-plugin/v1',
		'/settings',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'example_plugin_rest_get_settings',
				'permission_callback' => 'example_plugin_rest_permissions_check',
				'args'                => array(
					'key' => array(
						'description'       => __( 'Optional setting key to retrieve a single value.', 'example-plugin' ),
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_key',
					),
				),
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'example_plugin_rest_update_settings',
				'permission_callback' => 'example_plugin_rest_permissions_check',
				'args'                => array(
					'settings' => array(
						'description' => __( 'Key-value map of settings to update.', 'example-plugin' ),
						'type'        => 'object',
						'required'    => true,
					),
				),
			),
		)
	);

	register_rest_route(
		'example-plugin/v1',
		'/status',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'example_plugin_rest_get_status',
			'permission_callback' => '__return_true',
		)
	);
}

/**
 * Permission callback: require the current user to have `manage_options`.
 *
 * Used for all settings endpoints that read or write sensitive plugin data.
 *
 * @since 1.2.0
 *
 * @param WP_REST_Request $request The current REST request object.
 * @return bool|WP_Error True if the user has sufficient capabilities, WP_Error otherwise.
 */
function example_plugin_rest_permissions_check( $request ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return new WP_Error(
			'rest_forbidden',
			__( 'You do not have permission to manage Example Plugin settings.', 'example-plugin' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	return true;
}

/**
 * REST callback: return current plugin settings as JSON.
 *
 * When a `key` query parameter is provided, returns only that single setting.
 * Otherwise returns the full settings array.
 *
 * @since 1.2.0
 *
 * @param WP_REST_Request $request The current REST request, optionally containing
 *                                 a `key` parameter to filter the response.
 * @return WP_REST_Response JSON response containing the requested settings.
 */
function example_plugin_rest_get_settings( $request ) {
	$plugin = Example_Plugin::get_instance();
	$key    = $request->get_param( 'key' );

	if ( $key ) {
		$value = $plugin->get_settings( $key );

		return new WP_REST_Response(
			array(
				'key'   => $key,
				'value' => $value,
			),
			200
		);
	}

	// Return all settings when no key is specified.
	$all_settings = array();
	$known_keys   = array( 'enable_feature_a', 'enable_feature_b', 'api_endpoint', 'cache_ttl', 'log_level' );

	foreach ( $known_keys as $setting_key ) {
		$all_settings[ $setting_key ] = $plugin->get_settings( $setting_key );
	}

	return new WP_REST_Response( $all_settings, 200 );
}

/**
 * REST callback: update one or more plugin settings.
 *
 * Accepts a JSON body with a `settings` object. Each key-value pair is
 * sanitized and persisted via `Example_Plugin::update_setting()`.
 *
 * @since 1.2.0
 *
 * @param WP_REST_Request $request The current REST request containing a `settings`
 *                                 body parameter with the values to update.
 * @return WP_REST_Response JSON response with updated settings or error details.
 */
function example_plugin_rest_update_settings( $request ) {
	$plugin   = Example_Plugin::get_instance();
	$settings = $request->get_param( 'settings' );
	$updated  = array();
	$errors   = array();

	foreach ( (array) $settings as $key => $value ) {
		$sanitized_key = sanitize_key( $key );

		if ( empty( $sanitized_key ) ) {
			$errors[] = $key;
			continue;
		}

		$plugin->update_setting( $sanitized_key, $value );
		$updated[] = $sanitized_key;
	}

	if ( ! empty( $errors ) ) {
		return new WP_REST_Response(
			array(
				'updated' => $updated,
				'errors'  => $errors,
				'message' => __( 'Some settings could not be updated.', 'example-plugin' ),
			),
			207
		);
	}

	return new WP_REST_Response(
		array(
			'updated' => $updated,
			'message' => __( 'Settings updated successfully.', 'example-plugin' ),
		),
		200
	);
}

/**
 * REST callback: return plugin status information (public endpoint).
 *
 * Returns the plugin version and whether key features are enabled.
 * This endpoint is intentionally public (no authentication required).
 *
 * @since 1.2.0
 *
 * @param WP_REST_Request $request The current REST request object (unused).
 * @return WP_REST_Response JSON response with plugin status data.
 */
function example_plugin_rest_get_status( $request ) {
	return new WP_REST_Response(
		array(
			'active'  => example_plugin_is_active(),
			'version' => EXAMPLE_PLUGIN_VERSION,
		),
		200
	);
}

/**
 * Register custom REST API fields for Example Plugin.
 *
 * @since 1.3.0
 *
 * @return void
 */
function example_plugin_register_rest_fields() {
	register_rest_field( 'post', 'example_meta', array(
		'get_callback'    => 'example_plugin_get_meta',
		'update_callback' => 'example_plugin_update_meta',
		'schema'          => array(
			'description' => __( 'Example custom meta field added to posts.', 'example-plugin' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit' ),
		),
	) );

	register_rest_field( array( 'post', 'page' ), 'example_reading_time', array(
		'get_callback' => 'example_plugin_get_reading_time',
		'schema'       => array(
			'description' => __( 'Estimated reading time in minutes.', 'example-plugin' ),
			'type'        => 'integer',
			'context'     => array( 'view' ),
		),
	) );
}
