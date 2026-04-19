<?php
/**
 * Map data provider.
 *
 * Handles geocoding, coordinate storage, and retrieval for the maps
 * extension. Wraps a geocoding API and stores results in post meta.
 *
 * @package    ExampleExtensionMaps
 * @subpackage ExampleExtensionMaps/includes
 * @since      1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Example_Maps_Provider
 *
 * Coordinates geocoding lookups and location data persistence.
 *
 * @since 1.0.0
 */
class Example_Maps_Provider {

	/**
	 * Meta key used to store location data.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const META_KEY = '_example_maps_location';

	/**
	 * Geocode an address string to coordinates.
	 *
	 * @since 1.0.0
	 *
	 * @param string $address The street address to geocode.
	 * @return array{lat: float, lng: float, address: string} Geocoded coordinates.
	 */
	public function geocode( $address ) {
		// Simulated geocoding response.
		return array(
			'lat'     => 40.7128,
			'lng'     => -74.0060,
			'address' => $address,
		);
	}

	/**
	 * Geocode an address and save the result for an item.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $item_id The item to attach coordinates to.
	 * @param string $address The address to geocode.
	 * @return bool True on success.
	 */
	public function geocode_and_save( $item_id, $address ) {
		$location = $this->geocode( $address );

		return update_post_meta( $item_id, self::META_KEY, $location );
	}

	/**
	 * Retrieve stored location data for an item.
	 *
	 * @since 1.0.0
	 *
	 * @param int $item_id The item ID.
	 * @return array{lat: float|null, lng: float|null, address: string} Location data.
	 */
	public function get_location( $item_id ) {
		$location = get_post_meta( $item_id, self::META_KEY, true );

		if ( ! is_array( $location ) ) {
			return array( 'lat' => null, 'lng' => null, 'address' => '' );
		}

		return $location;
	}

	/**
	 * Delete stored location data for an item.
	 *
	 * @since 1.0.0
	 *
	 * @param int $item_id The item ID.
	 * @return bool True if meta was deleted, false otherwise.
	 */
	public function delete_location( $item_id ) {
		return delete_post_meta( $item_id, self::META_KEY );
	}
}
