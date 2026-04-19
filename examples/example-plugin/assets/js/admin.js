/**
 * Example Plugin — Admin JavaScript
 *
 * Handles admin UI interactions for the Example Plugin settings page.
 * Uses the WordPress Hooks API (wp.hooks) for extensibility so that
 * third-party code can modify plugin behaviour without patching this file.
 *
 * @file      admin.js
 * @package   ExamplePlugin
 * @since     1.0.0
 * @version   1.2.0
 *
 * @requires  wp-hooks
 * @requires  jquery
 */

/* global wp, jQuery, examplePluginData */

( function ( $, wp ) {
	'use strict';

	/**
	 * Initialize the Example Plugin admin UI.
	 *
	 * Sets up event listeners, processes the initial settings object passed
	 * from PHP via `wp_localize_script`, and fires the initialization hook
	 * so that third-party scripts can hook in after setup.
	 *
	 * @since 1.0.0
	 *
	 * @param {Object} config         Plugin configuration localized from PHP.
	 * @param {string} config.ajaxUrl WordPress AJAX endpoint URL.
	 * @param {string} config.nonce   Security nonce for AJAX requests.
	 * @param {Object} config.settings Current plugin settings key-value map.
	 * @param {Object} config.i18n    Translated strings keyed by identifier.
	 * @return {void}
	 */
	function initExamplePlugin( config ) {
		if ( ! config ) {
			return;
		}

		// Apply any registered filters to the settings before rendering.
		var filteredSettings = wp.hooks.applyFilters(
			'example_plugin.settings',
			config.settings
		);

		// Bind form submission handler.
		$( '#example-plugin-settings-form' ).on( 'submit', function ( e ) {
			e.preventDefault();
			saveSettings( filteredSettings, config );
		} );

		// Bind toggle switch handlers.
		$( '.example-plugin-toggle' ).on( 'change', function () {
			var key = $( this ).data( 'setting' );
			filteredSettings[ key ] = $( this ).is( ':checked' );
		} );

		// Fire the init action so third-party scripts can react.
		wp.hooks.doAction( 'example_plugin.init', filteredSettings, config );
	}

	/**
	 * Persist updated settings via the WordPress REST API.
	 *
	 * Sends a POST request to `example-plugin/v1/settings` with the current
	 * settings object and displays a success or error admin notice on completion.
	 *
	 * @since 1.0.0
	 *
	 * @param {Object} settings Key-value map of settings to save.
	 * @param {Object} config   Plugin configuration (ajaxUrl, nonce, i18n).
	 * @return {void}
	 */
	function saveSettings( settings, config ) {
		$.ajax( {
			url: wpApiSettings.root + 'example-plugin/v1/settings',
			method: 'POST',
			beforeSend: function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', wpApiSettings.nonce );
			},
			data: JSON.stringify( { settings: settings } ),
			contentType: 'application/json',
		} )
			.done( function () {
				showAdminNotice( config.i18n.saveSuccess, 'success' );
			} )
			.fail( function () {
				showAdminNotice( config.i18n.saveError, 'error' );
			} );
	}

	/**
	 * Render a dismissible WordPress-style admin notice.
	 *
	 * Inserts a `<div class="notice ...">` element directly after the
	 * `<h1>` heading on the current admin page. Any previous notice
	 * from this plugin is removed before the new one is inserted.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} message The human-readable message to display inside the notice.
	 * @param {string} type    Notice type: 'success', 'error', 'warning', or 'info'.
	 *                         Maps directly to the WP admin notice CSS class suffix.
	 * @return {void}
	 */
	var formatAdminNotice = function ( message, type ) {
		// Remove any previously inserted notice from this plugin.
		$( '.example-plugin-notice' ).remove();

		var $notice = $(
			'<div class="notice notice-' +
				type +
				' is-dismissible example-plugin-notice">' +
				'<p>' +
				$( '<span>' ).text( message ).html() +
				'</p>' +
				'</div>'
		);

		$( '.wrap h1' ).after( $notice );

		// Trigger WP's built-in dismiss button behaviour.
		if ( wp.notices && wp.notices.initialize ) {
			wp.notices.initialize();
		}
	};

	// Register the wp.hooks action that other scripts can use to piggyback init.
	wp.hooks.addAction(
		'example_plugin.init',
		'example-plugin',
		function ( settings ) {
			// Re-render any dynamic elements that depend on settings values.
			Object.keys( settings ).forEach( function ( key ) {
				var $toggle = $( '[data-setting="' + key + '"]' );
				if ( $toggle.is( ':checkbox' ) ) {
					$toggle.prop( 'checked', !! settings[ key ] );
				}
			} );
		}
	);

	// Register the wp.hooks filter that allows external code to modify settings
	// before the admin form renders.
	wp.hooks.addFilter(
		'example_plugin.settings',
		'example-plugin',
		function ( settings ) {
			// Default implementation: return settings unchanged.
			// Third-party code can add their own filter at higher priority.
			return settings;
		}
	);

	// Bootstrap on DOM ready.
	$( function () {
		if ( typeof examplePluginData !== 'undefined' ) {
			initExamplePlugin( examplePluginData );
		}
	} );

	// Expose public API for third-party scripts.
	window.ExamplePlugin = {
		init: initExamplePlugin,
		formatAdminNotice: formatAdminNotice,
	};
}( jQuery, wp ) );
