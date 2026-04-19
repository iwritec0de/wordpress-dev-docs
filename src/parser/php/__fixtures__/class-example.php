<?php
/**
 * Example plugin class.
 *
 * @since 1.0.0
 */
class My_Plugin {
    /**
     * Plugin version.
     *
     * @var string
     * @since 1.0.0
     */
    public $version = '1.0.0';

    /**
     * @var bool
     */
    protected static $initialized = false;

    /**
     * Constructor.
     *
     * @since 1.0.0
     * @param string $slug Plugin slug.
     */
    public function __construct( $slug ) {
        $this->slug = $slug;
    }

    /**
     * Get plugin version.
     *
     * @since 1.0.0
     * @return string The version string.
     */
    public function get_version() {
        return $this->version;
    }

    /**
     * Internal helper.
     *
     * @since 1.0.0
     * @return void
     */
    private function _setup() {}
}
