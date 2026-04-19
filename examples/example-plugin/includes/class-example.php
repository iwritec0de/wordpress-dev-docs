<?php
/**
 * Main plugin class.
 *
 * Implements the singleton pattern to provide a single access point to
 * the plugin's core functionality. Manages settings, hooks, and sub-systems.
 *
 * @package    ExamplePlugin
 * @subpackage ExamplePlugin/includes
 * @since      1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Example_Plugin
 *
 * Core plugin class responsible for initializing hooks, managing settings,
 * and coordinating plugin sub-systems.
 *
 * @since 1.0.0
 */
class Example_Plugin {

	/**
	 * Plugin slug used for option names, hook prefixes, and admin menu slugs.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const PLUGIN_SLUG = 'example-plugin';

	/**
	 * Current plugin version.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public $version = EXAMPLE_PLUGIN_VERSION;

	/**
	 * Singleton instance of this class.
	 *
	 * @since 1.0.0
	 * @var Example_Plugin|null
	 */
	protected static $instance = null;

	/**
	 * Cached plugin settings array.
	 *
	 * @since 1.0.0
	 * @var array<string, mixed>
	 */
	private $settings = array();

	/**
	 * Constructor — private to enforce singleton pattern.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		$this->init();
	}

	/**
	 * Return the singleton instance, creating it if it does not yet exist.
	 *
	 * @since 1.0.0
	 *
	 * @return Example_Plugin The single instance of this class.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Initialize plugin functionality by registering WordPress hooks.
	 *
	 * Loads settings, enqueues assets, and registers admin pages.
	 * Fires the `example_plugin_initialized` action after setup is complete.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init() {
		// Load settings early so they're available to everything else.
		$this->load_settings();

		// Front-end asset enqueueing.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Admin asset enqueueing and menu registration.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );

		// REST API routes.
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		/**
		 * Fires after Example Plugin has finished initializing.
		 *
		 * @since 1.0.0
		 *
		 * @param Example_Plugin $instance The initialized plugin instance.
		 */
		do_action( 'example_plugin_initialized', $this );
	}

	/**
	 * Load plugin settings from the database, applying filters for extensibility.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function load_settings() {
		$defaults = array(
			'enable_feature_a' => true,
			'enable_feature_b' => false,
			'api_endpoint'     => 'https://api.example.com/v1',
			'cache_ttl'        => 3600,
			'log_level'        => 'info',
		);

		/**
		 * Filter the default plugin settings before they are merged with saved values.
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, mixed> $defaults Default settings key-value pairs.
		 */
		$defaults = apply_filters( 'example_plugin_settings', $defaults );

		$saved          = get_option( self::PLUGIN_SLUG . '_settings', array() );
		$this->settings = wp_parse_args( $saved, $defaults );
	}

	/**
	 * Retrieve a single plugin setting by key.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key     The setting key to retrieve.
	 * @param mixed  $default Value to return when the key does not exist. Default null.
	 * @return mixed The setting value, or $default if the key is not found.
	 */
	public function get_settings( $key, $default = null ) {
		if ( array_key_exists( $key, $this->settings ) ) {
			return $this->settings[ $key ];
		}

		return $default;
	}

	/**
	 * Update a single plugin setting and persist it to the database.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key   The setting key to update.
	 * @param mixed  $value The new value for the setting.
	 * @return bool True if the option was updated successfully, false otherwise.
	 */
	public function update_setting( $key, $value ) {
		$this->settings[ $key ] = $value;

		return update_option( self::PLUGIN_SLUG . '_settings', $this->settings );
	}

	/**
	 * Enqueue front-end scripts and styles.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		wp_enqueue_style(
			'example-plugin-style',
			EXAMPLE_PLUGIN_URL . 'assets/css/style.css',
			array(),
			$this->version
		);
	}

	/**
	 * Enqueue admin scripts and styles on the plugin's settings page.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_admin_scripts( $hook_suffix ) {
		if ( 'settings_page_' . self::PLUGIN_SLUG !== $hook_suffix ) {
			return;
		}

		wp_enqueue_script(
			'example-plugin-admin',
			EXAMPLE_PLUGIN_URL . 'assets/js/admin.js',
			array( 'jquery', 'wp-hooks' ),
			$this->version,
			true
		);

		wp_localize_script(
			'example-plugin-admin',
			'examplePluginData',
			array(
				'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'example_plugin_nonce' ),
				'settings' => $this->settings,
				'i18n'     => array(
					'saveSuccess' => __( 'Settings saved.', 'example-plugin' ),
					'saveError'   => __( 'Could not save settings.', 'example-plugin' ),
				),
			)
		);
	}

	/**
	 * Register the plugin admin settings page under Settings menu.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_admin_menu() {
		add_options_page(
			__( 'Example Plugin Settings', 'example-plugin' ),
			__( 'Example Plugin', 'example-plugin' ),
			'manage_options',
			self::PLUGIN_SLUG,
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register REST API routes for this plugin.
	 *
	 * Delegates to the standalone rest-api.php file which keeps route
	 * definitions separate from the class.
	 *
	 * @since 1.2.0
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		example_plugin_register_rest_routes();
	}

	/**
	 * Render the HTML for the plugin settings admin page.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'example-plugin' ) );
		}

		echo '<div class="wrap">';
		echo '<h1>' . esc_html( get_admin_page_title() ) . '</h1>';
		echo '<p>' . esc_html__( 'Configure Example Plugin settings below.', 'example-plugin' ) . '</p>';
		echo '</div>';
	}
}
