<?php
interface Registerable {
    public function register(): void;
}

trait Singleton {
    private static $instance = null;

    public static function get_instance(): static {
        if ( null === static::$instance ) {
            static::$instance = new static();
        }
        return static::$instance;
    }
}

/**
 * Advanced plugin class.
 *
 * @since 1.0.0
 */
abstract class Plugin_Base {
    /**
     * Plugin version.
     *
     * @var string
     */
    public string $version = '1.0.0';

    /** @var int */
    protected static int $count = 0;

    /** Plugin slug constant. */
    const SLUG = 'my-plugin';

    /**
     * Plugin display name.
     *
     * @since 1.0.0
     */
    const NAME = 'My Plugin';

    abstract public function boot(): void;
}

/**
 * Concrete plugin class.
 *
 * @since 1.0.0
 */
final class My_Plugin extends Plugin_Base implements Registerable {
    /**
     * @param string $slug  Plugin slug.
     * @param bool   $debug Enable debug mode.
     */
    public function __construct( string $slug, bool $debug = false ) {}

    /**
     * Boot the plugin.
     *
     * @since 1.0.0
     * @return void
     */
    public function boot(): void {}

    /**
     * Register plugin hooks.
     *
     * @since 1.0.0
     * @return void
     */
    public function register(): void {}

    /**
     * Get typed value.
     *
     * @return array<string, mixed>
     */
    public function get_config(): array { return []; }
}
