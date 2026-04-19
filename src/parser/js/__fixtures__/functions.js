/**
 * Initializes the plugin.
 * @since 1.0.0
 * @param {string} slug - Plugin slug.
 * @param {Object} [options] - Optional config.
 * @returns {boolean} True on success.
 */
function initPlugin(slug, options) {
  return true;
}

/**
 * Formats a price value.
 * @since 1.1.0
 * @param {number} amount - The price.
 * @param {string} [currency='USD'] - Currency code.
 * @returns {string} Formatted price string.
 */
export const formatPrice = (amount, currency = 'USD') => {
  return `${currency} ${amount.toFixed(2)}`;
};

function undocumentedHelper() {}
