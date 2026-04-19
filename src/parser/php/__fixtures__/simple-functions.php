<?php
/**
 * Gets the plugin settings.
 *
 * @since 1.0.0
 * @param string $key     The setting key.
 * @param mixed  $default Default value.
 * @return mixed The setting value.
 */
function my_plugin_get_settings( $key, $default = null ) {
    return get_option( $key, $default );
}

/**
 * Updates a plugin setting.
 *
 * @since 1.1.0
 * @deprecated 2.0.0 Use my_plugin_set_option() instead.
 * @param string $key   Setting key.
 * @param mixed  $value New value.
 * @return bool True on success, false on failure.
 * @throws InvalidArgumentException If key is empty.
 */
function my_plugin_update_setting( $key, $value ) {
    if ( empty( $key ) ) {
        throw new \InvalidArgumentException( 'Key cannot be empty' );
    }
    return update_option( $key, $value );
}

function undocumented_function() {
    return true;
}
