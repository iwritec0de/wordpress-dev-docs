<?php
/**
 * Example Theme functions and definitions.
 *
 * Sets up theme support, enqueues styles and scripts, registers navigation
 * menus, and provides custom hooks for child themes and plugins to extend.
 *
 * @package   ExampleTheme
 * @since     1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Theme version constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_THEME_VERSION', '1.0.0' );

/**
 * Theme directory path constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_THEME_DIR', get_template_directory() );

/**
 * Theme directory URL constant.
 *
 * @since 1.0.0
 * @var string
 */
define( 'EXAMPLE_THEME_URL', get_template_directory_uri() );

/**
 * Set up theme defaults and register support for various WordPress features.
 *
 * Fires on `after_setup_theme` to configure theme supports, editor styles,
 * block styles, and image sizes.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_theme_setup() {
	// Add default posts and comments RSS feed links to <head>.
	add_theme_support( 'automatic-feed-links' );

	// Let WordPress manage the document title.
	add_theme_support( 'title-tag' );

	// Enable featured images on posts and pages.
	add_theme_support( 'post-thumbnails' );

	// Switch default core block markup to output valid HTML5.
	add_theme_support(
		'html5',
		array( 'comment-list', 'comment-form', 'search-form', 'gallery', 'caption', 'style', 'script' )
	);

	// Add support for block styles.
	add_theme_support( 'wp-block-styles' );

	// Add support for wide and full-width alignments.
	add_theme_support( 'align-wide' );

	// Add support for editor styles and enqueue them.
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );

	// Add support for responsive embedded content.
	add_theme_support( 'responsive-embeds' );

	// Add support for block-based template parts.
	add_theme_support( 'block-template-parts' );

	// Register navigation menus.
	register_nav_menus(
		array(
			'primary'  => __( 'Primary Navigation', 'example-theme' ),
			'footer'   => __( 'Footer Navigation', 'example-theme' ),
		)
	);

	// Add custom image sizes.
	add_image_size( 'example-theme-featured', 1200, 630, true );

	/**
	 * Fires after Example Theme has finished registering theme supports.
	 *
	 * Child themes and plugins can use this action to add additional theme
	 * supports or override defaults.
	 *
	 * @since 1.0.0
	 */
	do_action( 'example_theme_after_setup' );
}
add_action( 'after_setup_theme', 'example_theme_setup' );

/**
 * Enqueue front-end styles and scripts.
 *
 * Loads the main stylesheet and navigation script. Fires the
 * `example_theme_enqueue_assets` action after core assets are queued so
 * child themes can add or replace assets.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_theme_enqueue_assets() {
	// Main stylesheet.
	wp_enqueue_style(
		'example-theme-style',
		get_stylesheet_uri(),
		array(),
		EXAMPLE_THEME_VERSION
	);

	// Front-end navigation script.
	wp_enqueue_script(
		'example-theme-navigation',
		EXAMPLE_THEME_URL . '/assets/js/navigation.js',
		array(),
		EXAMPLE_THEME_VERSION,
		true
	);

	/**
	 * Fires after Example Theme core assets are enqueued.
	 *
	 * Use this action to enqueue additional styles or scripts that
	 * depend on the theme's assets being loaded first.
	 *
	 * @since 1.0.0
	 */
	do_action( 'example_theme_enqueue_assets' );
}
add_action( 'wp_enqueue_scripts', 'example_theme_enqueue_assets' );

/**
 * Filter the body classes to add theme-specific classes.
 *
 * Adds contextual classes such as `has-sidebar`, `has-featured-image`,
 * and a custom brand class. Other plugins and child themes can modify
 * the final list via the `example_theme_body_classes` filter.
 *
 * @since 1.0.0
 *
 * @param string[] $classes Array of CSS class names for the body element.
 * @return string[] Modified array of CSS class names.
 */
function example_theme_body_classes( $classes ) {
	// Add a class if the current page has a sidebar.
	if ( is_active_sidebar( 'sidebar-1' ) ) {
		$classes[] = 'has-sidebar';
	}

	// Add a class when a featured image is present on singular pages.
	if ( is_singular() && has_post_thumbnail() ) {
		$classes[] = 'has-featured-image';
	}

	$classes[] = 'example-theme';

	/**
	 * Filter the body CSS classes added by Example Theme.
	 *
	 * Allows child themes and plugins to modify, add, or remove body
	 * classes before they are output.
	 *
	 * @since 1.0.0
	 *
	 * @param string[] $classes Array of CSS class names.
	 */
	$classes = apply_filters( 'example_theme_body_classes', $classes );

	return $classes;
}
add_filter( 'body_class', 'example_theme_body_classes' );

/**
 * Register widget areas (sidebars).
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_theme_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Primary Sidebar', 'example-theme' ),
			'id'            => 'sidebar-1',
			'description'   => __( 'Widgets in this area appear in the sidebar on posts and pages.', 'example-theme' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Footer Widgets', 'example-theme' ),
			'id'            => 'footer-1',
			'description'   => __( 'Widgets displayed in the site footer.', 'example-theme' ),
			'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h3 class="footer-widget-title">',
			'after_title'   => '</h3>',
		)
	);
}
add_action( 'widgets_init', 'example_theme_widgets_init' );

/**
 * Render the site copyright notice.
 *
 * Outputs a paragraph element containing the site name and current year.
 * The full HTML output can be replaced via the `example_theme_copyright`
 * filter.
 *
 * @since 1.0.0
 *
 * @return void
 */
function example_theme_copyright() {
	$site_name = get_bloginfo( 'name' );
	$year      = gmdate( 'Y' );

	$html = sprintf(
		'<p class="site-copyright">&copy; %1$s %2$s</p>',
		esc_html( $year ),
		esc_html( $site_name )
	);

	/**
	 * Filter the copyright HTML rendered in the footer.
	 *
	 * @since 1.0.0
	 *
	 * @param string $html      The default copyright HTML.
	 * @param string $site_name The site name from bloginfo.
	 * @param string $year      The four-digit current year.
	 */
	echo apply_filters( 'example_theme_copyright', $html, $site_name, $year );
}

/**
 * Get the reading time estimate for a post.
 *
 * Calculates approximate reading time based on a configurable
 * words-per-minute rate. Returns a human-readable string.
 *
 * @since 1.0.0
 *
 * @param int|null $post_id Optional post ID. Defaults to the current post.
 * @return string Reading time string, e.g. "3 min read".
 */
function example_theme_reading_time( $post_id = null ) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return '';
	}

	$content   = wp_strip_all_tags( $post->post_content );
	$words     = str_word_count( $content );

	/**
	 * Filter the words-per-minute rate used for reading time calculation.
	 *
	 * @since 1.0.0
	 *
	 * @param int $wpm Words per minute. Default 200.
	 */
	$wpm = apply_filters( 'example_theme_reading_wpm', 200 );

	$minutes = max( 1, (int) ceil( $words / $wpm ) );

	return sprintf(
		/* translators: %d: number of minutes */
		_n( '%d min read', '%d min read', $minutes, 'example-theme' ),
		$minutes
	);
}
