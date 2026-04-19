<?php
/**
 * Native typed function.
 *
 * @since 2.0.0
 * @param string $key     Setting key.
 * @param int    $limit   Max results.
 * @return array The results.
 */
function typed_get( string $key, ?int $limit = null ): array {
    return [];
}

/**
 * Variadic function.
 *
 * @since 2.0.0
 * @param string ...$tags Tags to register.
 * @return void
 */
function register_tags( string ...$tags ): void {}

/**
 * By-reference param.
 *
 * @since 2.0.0
 * @param array $items Items to process (modified in-place).
 * @return bool
 */
function process_items( array &$items ): bool {
    return true;
}

define( 'MY_PLUGIN_VERSION', '2.1.0' );
define( 'MY_PLUGIN_DIR', __DIR__ );
