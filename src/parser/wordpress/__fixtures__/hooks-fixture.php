<?php
/**
 * Plugin bootstrap. Registers all hooks.
 */

// Registration calls — should be IGNORED by the parser
add_action( 'init', 'my_plugin_init' );
add_action( 'plugins_loaded', 'my_plugin_loaded', 20, 0 );
add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ), 10, 1 );
add_action( 'admin_init', array( 'My_Plugin_Admin', 'setup' ) );
add_filter( 'the_content', 'my_plugin_filter_content', 15, 2 );
add_filter( 'wp_title', function( $title ) {
    return $title . ' | My Plugin';
} );

/**
 * Fires after the plugin has finished initializing.
 *
 * @since 1.0.0
 */
do_action( 'my_plugin_initialized' );

/**
 * Fires when plugin settings have been loaded from the database.
 *
 * @since 1.2.0
 *
 * @param array  $settings The resolved settings array.
 * @param string $context  The context in which settings were loaded.
 */
do_action( 'my_plugin_settings_loaded', $settings, $context );

/**
 * Filter the rendered content before output.
 *
 * @since 1.0.0
 *
 * @param string $raw_content The unfiltered content string.
 */
$content = apply_filters( 'my_plugin_content', $raw_content );

/**
 * Filter the final result before returning.
 *
 * @since 1.1.0
 *
 * @param mixed $result  The computed result.
 * @param int   $post_id The post ID.
 */
return apply_filters( 'my_plugin_result', $result, $post_id );

// apply_filters_ref_array (no docblock)
apply_filters_ref_array( 'my_plugin_ref_filter', array( &$value ) );

// Nested inside a function body — should still be found
function my_plugin_register_hooks() {
    add_action( 'save_post', 'my_plugin_save_post_handler' );

    /**
     * Filter post data before saving.
     *
     * @since 1.0.0
     *
     * @param array $data The post data array.
     */
    $filtered = apply_filters( 'my_plugin_post_data', $data );
}

// Nested inside a class method — registrations ignored, dispatches would be kept
class My_Plugin_Hooks {
    public function register() {
        add_action( 'wp_head', array( $this, 'output_head' ) );
        add_filter( 'body_class', array( $this, 'add_body_class' ) );
    }
}
