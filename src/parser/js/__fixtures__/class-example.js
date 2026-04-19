/**
 * Plugin registry class.
 * @since 1.0.0
 */
export class PluginRegistry {
  /**
   * Register a plugin.
   * @since 1.0.0
   * @param {string} name - Plugin name.
   * @param {Function} factory - Factory function.
   * @returns {void}
   */
  register(name, factory) {}

  /**
   * Get a registered plugin.
   * @since 1.0.0
   * @param {string} name - Plugin name.
   * @returns {Function|undefined} The factory or undefined.
   */
  get(name) {}

  /**
   * @static
   * @returns {PluginRegistry} Singleton instance.
   */
  static getInstance() {}
}
